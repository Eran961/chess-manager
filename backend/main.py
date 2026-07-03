from fastapi import FastAPI, Query, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
from curl_cffi import requests as cf_requests
from bs4 import BeautifulSoup
import asyncio
import re
import json
import time
from concurrent.futures import ThreadPoolExecutor

# In-memory cache: {teamId: {"rounds": [...], "ts": float}}
_team_cache: dict = {}
CACHE_TTL = 3600  # 1 hour

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

ALLOWED_DOMAIN = "chess.org.il"
HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}

executor = ThreadPoolExecutor(max_workers=10)


def fetch_url(url: str) -> str:
    if ALLOWED_DOMAIN not in url:
        raise ValueError("Domain not allowed")
    resp = cf_requests.get(url, impersonate="firefox120", timeout=30, headers=HEADERS)
    resp.raise_for_status()
    return resp.text


def fetch_post(url: str, data: dict) -> str:
    if ALLOWED_DOMAIN not in url:
        raise ValueError("Domain not allowed")
    post_headers = {**HEADERS, "Content-Type": "application/x-www-form-urlencoded"}
    resp = cf_requests.post(url, data=data, impersonate="firefox120", timeout=30, headers=post_headers)
    resp.raise_for_status()
    return resp.text


def get_form_state(soup) -> dict:
    state = {}
    for name in ("__VIEWSTATE", "__VIEWSTATEGENERATOR", "__EVENTVALIDATION", "__VIEWSTATEENCRYPTED"):
        el = soup.find("input", {"name": name})
        if el:
            state[name] = el.get("value", "")
    return state


def clean_text(tag) -> str:
    return re.sub(r'\s+', ' ', tag.get_text(separator=' ')).strip()


# ── Raw proxy (kept for backwards compat) ──────────────────────────────────────

@app.get("/proxy")
def proxy(url: str = Query(...)):
    if ALLOWED_DOMAIN not in url:
        raise HTTPException(status_code=403, detail="Domain not allowed")
    try:
        html = fetch_url(url)
        return HTMLResponse(content=html)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Club players ───────────────────────────────────────────────────────────────

@app.get("/api/club-players")
def club_players(clubId: int = Query(...)):
    url = f"https://www.chess.org.il/Clubs/Club.aspx?Id={clubId}&View=Players"
    try:
        html = fetch_url(url)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    soup = BeautifulSoup(html, "html.parser")
    players = []
    for a in soup.find_all("a", href=re.compile(r"Player\.aspx\?Id=\d+", re.I)):
        fed_id_m = re.search(r"Id=(\d+)", a["href"])
        if not fed_id_m:
            continue
        fed_id = int(fed_id_m.group(1))
        name = clean_text(a)
        if not name or len(name) < 2:
            continue
        row = a.find_parent("tr")
        cells = [clean_text(td) for td in row.find_all("td")] if row else []
        rating = next((int(c) for c in cells if re.fullmatch(r"\d{3,4}", c)), None)
        birth = next((int(c) for c in cells if re.fullmatch(r"(19|20)\d{2}", c)), None)
        gender_raw = next((c for c in cells if c in ("זכר", "נקבה", "M", "F")), None)
        players.append({
            "fedId": fed_id,
            "name": name,
            "rating": rating,
            "birthYear": birth,
            "gender": gender_raw,
        })

    return JSONResponse(content=players)


# ── Club teams ─────────────────────────────────────────────────────────────────

@app.get("/api/club-teams")
def club_teams(clubId: int = Query(...)):
    url = f"https://www.chess.org.il/Clubs/Club.aspx?Id={clubId}&View=LeagueTeams"
    try:
        html = fetch_url(url)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table", id=re.compile(r"LeagueTeamsGridView", re.I))
    if not table:
        raise HTTPException(status_code=404, detail="Teams table not found")

    teams = []
    for row in table.find_all("tr")[1:]:
        cells = [clean_text(td) for td in row.find_all("td")]
        if len(cells) < 7:
            continue
        status = cells[6]
        if "פעילה" not in status or "לא פעילה" in status:
            continue
        team_type = cells[0].strip()
        division = re.sub(r"[''']", "", cells[1].strip())
        name = cells[5].strip()
        hf = row.find("input", id=re.compile(r"TeamIdHF", re.I))
        team_id = int(hf["value"]) if hf and hf.get("value", "").isdigit() else None
        if not name or len(name) < 2:
            continue
        teams.append({"name": name, "type": team_type, "division": division, "teamId": team_id})

    return JSONResponse(content=teams)


# ── Team matches (parallel fetch for all teams) ────────────────────────────────

def find_date_near_table(table) -> str | None:
    """Search for DD/MM/YYYY date in table, its parent, and sibling elements."""
    DATE_PAT = re.compile(r"(\d{1,2}/\d{1,2}/\d{4})")

    def normalize(raw: str) -> str:
        parts = raw.split("/")
        return f"{parts[0].zfill(2)}/{parts[1].zfill(2)}/{parts[2]}"

    # 1. Inside the table itself (covers played matches where date is in tbody rows)
    m = DATE_PAT.search(clean_text(table))
    if m:
        return normalize(m.group(1))

    # 2. Sibling elements in the same repeater container
    parent = table.parent
    if parent:
        # Check each sibling element (labels/spans next to the table)
        for sibling in parent.children:
            if sibling == table:
                continue
            text = clean_text(sibling) if hasattr(sibling, 'get_text') else str(sibling).strip()
            m = DATE_PAT.search(text)
            if m:
                return normalize(m.group(1))
        # Also check the full parent text
        m = DATE_PAT.search(clean_text(parent))
        if m:
            return normalize(m.group(1))

    # 3. Walk up two more levels
    grandparent = parent.parent if parent else None
    if grandparent:
        m = DATE_PAT.search(clean_text(grandparent))
        if m:
            return normalize(m.group(1))

    return None


def parse_score(raw: str) -> float | None:
    s = raw.strip()
    if s in ("1", "1.0"): return 1.0
    if s in ("0", "0.0"): return 0.0
    if s in ("½", "0.5", "1/2"): return 0.5
    if s == "+": return 1.0
    if s == "-": return 0.0
    try: return float(s)
    except: return None


def parse_board_games(table) -> list:
    """Extract individual board results from a round table's tbody."""
    games = []
    tbody = table.find("tbody")
    if not tbody:
        return games
    for tr in tbody.find_all("tr"):
        cells = [clean_text(td) for td in tr.find_all("td")]
        # 6-col: [board, home_player, home_score, "–"/"-", away_score, away_player]
        # 5-col: [board, home_player, home_score, away_score, away_player]
        if len(cells) >= 6:
            board_raw, home_p, h_raw, _, a_raw, away_p = cells[0], cells[1], cells[2], cells[3], cells[4], cells[5]
        elif len(cells) == 5:
            board_raw, home_p, h_raw, a_raw, away_p = cells
        else:
            continue
        if not home_p and not away_p:
            continue
        try:
            board_num = int(re.search(r"\d+", board_raw).group())
        except Exception:
            board_num = None
        h_score = parse_score(h_raw)
        a_score = parse_score(a_raw)
        games.append({
            "board": board_num,
            "homePlayer": home_p,
            "homeResult": h_score,
            "awayPlayer": away_p,
            "awayResult": a_score,
        })
    return games


def parse_team_captain(html: str) -> str:
    """Extract the team contact/captain name from the TeamContactsGrid table."""
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table", id=re.compile(r"TeamContactsGrid", re.I))
    if not table:
        return ""
    for tr in table.find_all("tr"):
        cells = [clean_text(td) for td in tr.find_all("td")]
        if len(cells) >= 2 and cells[0]:
            return cells[0]
    return ""


def parse_team_roster(html: str) -> list:
    """Extract the official ordered player roster from the team page."""
    soup = BeautifulSoup(html, "html.parser")
    # The real table ID on chess.org.il team pages
    roster_table = soup.find("table", id=re.compile(r"TeamPlayersGridView", re.I))
    if not roster_table:
        return []
    players = []
    pos = 0
    for tr in roster_table.find_all("tr"):
        cells = tr.find_all("td")
        if not cells:
            continue
        a = tr.find("a", href=re.compile(r"Player", re.I))
        if not a:
            continue
        name = clean_text(a)
        if name:
            pos += 1
            players.append({"position": pos, "name": name})
    return players


def parse_team_matches(html: str, team: dict) -> list:
    """Return all rounds for a team, each with its own date field (DD/MM/YYYY)."""
    soup = BeautifulSoup(html, "html.parser")
    results = []
    for table in soup.find_all("table", id=re.compile(r"RoundsRepeter_ctl\d+_GamesGridView", re.I)):
        match_date = find_date_near_table(table)  # may be None for future rounds
        thead = table.find("thead")
        if not thead:
            continue
        ths = [clean_text(th) for th in thead.find_all("th")]
        round_m = re.search(r"סיבוב\s*(\d+)", ths[0]) if ths else None
        round_num = int(round_m.group(1)) if round_m else None
        home_a = thead.find("a", id=re.compile(r"HostTeamHL", re.I))
        away_a = thead.find("a", id=re.compile(r"AwayTeamHL", re.I))
        home_team = clean_text(home_a) if home_a else (ths[1] if len(ths) > 1 else "")
        away_team = clean_text(away_a) if away_a else (ths[5] if len(ths) > 5 else "")
        home_score_raw = ths[2] if len(ths) > 2 else ""
        away_score_raw = ths[4] if len(ths) > 4 else ""
        home_score = float(home_score_raw) if re.search(r"\d", home_score_raw) else None
        away_score = float(away_score_raw) if re.search(r"\d", away_score_raw) else None
        if not home_team and not away_team:
            continue
        div = team.get("division", "")
        time_slot = "15:00" if (div == "ג" or "ג" in div) else "10:00"
        results.append({
            "teamId": team["teamId"],
            "teamName": team["name"],
            "type": team.get("type", "בוגרים"),
            "division": div,
            "roundNumber": round_num,
            "matchDate": match_date,
            "homeTeam": home_team,
            "awayTeam": away_team,
            "homeScore": home_score,
            "awayScore": away_score,
            "isPlayed": home_score is not None and away_score is not None,
            "timeSlot": time_slot,
            "games": parse_board_games(table),
        })
    return results


def name_key(name: str) -> frozenset:
    """Order-independent key: {'בוריס','גלפנד'} matches regardless of word order."""
    return frozenset(name.strip().split())


def aggregate_players(rounds: list, team_name: str, roster: list) -> list:
    """Aggregate per-player stats. Includes all roster members, sorted by roster position."""
    players: dict = {}

    # Seed all registered players; build lookup by word-set so order doesn't matter
    lookup: dict = {}  # frozenset of name words → canonical roster name
    for r in roster:
        entry = {"name": r["name"], "position": r["position"],
                 "games": 0, "wins": 0, "draws": 0, "losses": 0, "points": 0.0}
        players[r["name"]] = entry
        lookup[name_key(r["name"])] = r["name"]

    # Merge in game results
    for r in rounds:
        if not r.get("isPlayed"):
            continue
        is_home = r.get("homeTeam") == team_name
        for g in r.get("games", []):
            raw_name = g["homePlayer"] if is_home else g["awayPlayer"]
            result = g["homeResult"] if is_home else g["awayResult"]
            if not raw_name or result is None:
                continue
            canonical = lookup.get(name_key(raw_name))
            if canonical:
                p = players[canonical]
            else:
                if raw_name not in players:
                    players[raw_name] = {"name": raw_name, "position": 999,
                                         "games": 0, "wins": 0, "draws": 0, "losses": 0, "points": 0.0}
                p = players[raw_name]
            p["games"] += 1
            p["points"] += result
            if result == 1.0:   p["wins"] += 1
            elif result == 0.5: p["draws"] += 1
            else:               p["losses"] += 1

    return sorted(players.values(), key=lambda x: x["position"])


def fetch_team(team: dict, fed_date: str) -> tuple:
    team_id = team.get("teamId")
    url = f"https://www.chess.org.il/Tournaments/TeamInTournament.aspx?TeamId={team_id}"
    try:
        now = time.time()
        cached = _team_cache.get(team_id)
        if cached and now - cached["ts"] < CACHE_TTL:
            all_rounds = cached["rounds"]
        else:
            html = fetch_url(url)
            all_rounds = parse_team_matches(html, team)
            _team_cache[team_id] = {"rounds": all_rounds, "ts": now}
        matches = [m for m in all_rounds if m.get("matchDate") == fed_date]
        status = "ok" if matches else "nodate"
        return team["name"], status, matches
    except Exception:
        return team["name"], "fail", []


def fetch_team_rounds(team: dict) -> tuple:
    """Return ALL rounds for a team (no date filter) for client-side caching."""
    team_id = team.get("teamId")
    url = f"https://www.chess.org.il/Tournaments/TeamInTournament.aspx?TeamId={team_id}"
    try:
        now = time.time()
        cached = _team_cache.get(team_id)
        if cached and now - cached["ts"] < CACHE_TTL:
            rounds = cached["rounds"]
        else:
            html = fetch_url(url)
            rounds = parse_team_matches(html, team)
            _team_cache[team_id] = {"rounds": rounds, "ts": now}
        return team["name"], "ok", rounds
    except Exception:
        return team["name"], "fail", []


class TeamRoundsRequest(BaseModel):
    teams: list


@app.post("/api/team-rounds-stream")
async def team_rounds_stream(body: TeamRoundsRequest):
    async def generate():
        loop = asyncio.get_event_loop()
        pending = {
            asyncio.ensure_future(
                loop.run_in_executor(executor, fetch_team_rounds, team)
            )
            for team in body.teams
        }
        while pending:
            done, pending = await asyncio.wait(pending, return_when=asyncio.FIRST_COMPLETED)
            for task in done:
                team_name, status, rounds = task.result()
                payload = json.dumps(
                    {"teamName": team_name, "status": status, "rounds": rounds},
                    ensure_ascii=False
                )
                yield f"data: {payload}\n\n"
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


class TeamMatchRequest(BaseModel):
    teams: list
    date: str  # YYYY-MM-DD


@app.post("/api/team-matches")
async def team_matches(body: TeamMatchRequest):
    try:
        y, mo, d = body.date.split("-")
        fed_date = f"{d}/{mo}/{y}"
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format, expected YYYY-MM-DD")

    loop = asyncio.get_event_loop()
    tasks = [loop.run_in_executor(executor, fetch_team, team, fed_date) for team in body.teams]
    results_raw = await asyncio.gather(*tasks)

    all_matches = []
    statuses = {}
    seen = set()
    for team_name, status, matches in results_raw:
        statuses[team_name] = status
        for m in matches:
            key = f"{m['homeTeam']}|{m['awayTeam']}|{m['roundNumber']}"
            if key not in seen:
                seen.add(key)
                all_matches.append(m)

    return JSONResponse(content={"matches": all_matches, "statuses": statuses})


@app.post("/api/team-matches-stream")
async def team_matches_stream(body: TeamMatchRequest):
    try:
        y, mo, d = body.date.split("-")
        fed_date = f"{d}/{mo}/{y}"
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format, expected YYYY-MM-DD")

    async def generate():
        loop = asyncio.get_event_loop()
        seen_keys = set()

        pending = {
            asyncio.ensure_future(
                loop.run_in_executor(executor, fetch_team, team, fed_date)
            )
            for team in body.teams
        }

        while pending:
            done, pending = await asyncio.wait(pending, return_when=asyncio.FIRST_COMPLETED)
            for task in done:
                team_name, status, matches = task.result()
                clean = []
                for m in matches:
                    key = f"{m['homeTeam']}|{m['awayTeam']}|{m['roundNumber']}"
                    if key not in seen_keys:
                        seen_keys.add(key)
                        clean.append(m)
                payload = json.dumps(
                    {"teamName": team_name, "status": status, "matches": clean},
                    ensure_ascii=False
                )
                yield f"data: {payload}\n\n"

        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Team players ──────────────────────────────────────────────────────────────

class TeamPlayersRequest(BaseModel):
    teamId: int
    teamName: str
    type: str = "בוגרים"
    division: str = ""


@app.post("/api/team-players")
def team_players(body: TeamPlayersRequest):
    """Fetch all rounds for a team and return aggregated per-player stats."""
    team = {"teamId": body.teamId, "name": body.teamName, "type": body.type, "division": body.division}
    url = f"https://www.chess.org.il/Tournaments/TeamInTournament.aspx?TeamId={body.teamId}"
    try:
        now = time.time()
        cached = _team_cache.get(body.teamId)
        if cached and now - cached["ts"] < CACHE_TTL and cached.get("roster") is not None:
            rounds = cached["rounds"]
            roster = cached["roster"]
            captain = cached.get("captain", "")
        else:
            html = fetch_url(url)
            rounds = parse_team_matches(html, team)
            roster = parse_team_roster(html)
            captain = parse_team_captain(html)
            _team_cache[body.teamId] = {"rounds": rounds, "roster": roster, "captain": captain, "ts": now}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    players = aggregate_players(rounds, body.teamName, roster)
    return JSONResponse(content={"players": players, "rounds": len(rounds), "captain": captain})


# ── Health ─────────────────────────────────────────────────────────────────────

@app.get("/api/debug-team")
def debug_team(teamId: int = Query(...)):
    """Show all tables on team page + player names from roster candidates vs game results."""
    url = f"https://www.chess.org.il/Tournaments/TeamInTournament.aspx?TeamId={teamId}"
    try:
        html = fetch_url(url)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    soup = BeautifulSoup(html, "html.parser")

    # All non-rounds tables
    non_round_tables = []
    for t in soup.find_all("table"):
        tid = t.get("id", "")
        if re.search(r"RoundsRepeter", tid, re.I):
            continue
        rows = [tr for tr in t.find_all("tr") if tr.find_all("td")]
        if not rows:
            continue
        links = [clean_text(a) for a in t.find_all("a", href=re.compile(r"Player", re.I))]
        non_round_tables.append({
            "id": tid,
            "rows": len(rows),
            "playerLinks": links[:20],
            "firstRowCells": [clean_text(td) for td in rows[0].find_all("td")][:6],
        })

    # Player names from first round game table
    game_tables = soup.find_all("table", id=re.compile(r"RoundsRepeter_ctl00_GamesGridView", re.I))
    game_names = []
    if game_tables:
        tbody = game_tables[0].find("tbody")
        if tbody:
            for tr in tbody.find_all("tr"):
                cells = [clean_text(td) for td in tr.find_all("td")]
                if len(cells) >= 5:
                    game_names.append({"home": cells[1], "away": cells[4]})

    return JSONResponse(content={
        "nonRoundTables": non_round_tables,
        "gameNamesRound1": game_names,
    })


@app.post("/api/clear-team-cache")
def clear_team_cache(teamId: int = Query(None)):
    if teamId is not None:
        _team_cache.pop(teamId, None)
        return {"cleared": [teamId]}
    else:
        keys = list(_team_cache.keys())
        _team_cache.clear()
        return {"cleared": keys}


def parse_player_profile(html: str, fed_id: int, url: str = None) -> dict:
    """Parse individual player profile from chess.org.il Player.aspx page.

    The page puts all personal info in one large text blob inside PlayerFormView,
    and tournament history in a child TournamentsGridView table.
    """
    soup = BeautifulSoup(html, "html.parser")
    profile: dict = {"fedId": fed_id}

    # ── Name from H2 heading ────────────────────────────────────────────────────
    h2 = soup.find("h2")
    if h2:
        profile["name"] = clean_text(h2)

    # ── Basic info from the FormView text blob ──────────────────────────────────
    form_table = soup.find("table", id=re.compile(r"PlayerFormView$", re.I))
    if form_table:
        # Grab the first (large) cell text — it contains all personal fields
        first_td = form_table.find("td")
        text = clean_text(first_td) if first_td else ""

        m = re.search(r"שנת לידה[:\s]+(\d{4})", text)
        if m:
            profile["birthYear"] = int(m.group(1))

        m = re.search(r"מד כושר ישראלי\s*:\s*(\d+)", text)
        if m:
            profile["rating"] = int(m.group(1))

        m = re.search(r"צפוי:\s*(\d+)", text)
        if m:
            profile["ratingExpected"] = int(m.group(1))

        m = re.search(r"תוקף כרטיס שחמטאי\s+(\d{2}/\d{2}/\d{4})", text)
        if m:
            profile["cardExpiry"] = m.group(1)

        m = re.search(r"מד כושר FIDE[^:]*:\s*(\d+)", text)
        if m:
            profile["fide"] = int(m.group(1))

        m = re.search(r"דרגה\s+(\S+)", text)
        if m:
            profile["grade"] = m.group(1)

        # Gender is not explicit; infer from player number pattern or leave absent

    # ── Tournament history from TournamentsGridView (all pages) ─────────────────
    # Columns: תאריך התחלה | תאריך עדכון מד כושר | תחרות | משחקים | נקודות | רמת ביצוע | תוצאה | שינוי מד כושר
    GRID_RE = re.compile(r"TournamentsGridView", re.I)
    # UniqueID uses $ separators (table id uses _)
    tourn_table = soup.find("table", id=GRID_RE)
    tournaments, max_page = _parse_tourn_rows(tourn_table)

    if max_page > 1 and url:
        grid_unique_id = (tourn_table["id"].replace("_", "$")
                         if tourn_table and tourn_table.get("id") else
                         "ctl00$ContentPlaceHolder1$PlayerFormView$TournamentsGridView")
        form_state = get_form_state(soup)
        for page_num in range(2, max_page + 1):
            try:
                post_data = {**form_state,
                             "__EVENTTARGET": grid_unique_id,
                             "__EVENTARGUMENT": f"Page${page_num}"}
                page_html  = fetch_post(url, post_data)
                page_soup  = BeautifulSoup(page_html, "html.parser")
                page_table = page_soup.find("table", id=GRID_RE)
                page_rows, _ = _parse_tourn_rows(page_table)
                tournaments.extend(page_rows)
                form_state = get_form_state(page_soup)
            except Exception as exc:
                print(f"[player-profile] pagination page {page_num} failed: {exc}")
                break

    profile["tournaments"] = tournaments

    # ── League history via ShowLeaguePanelButton postback ──────────────────────
    if url:
        try:
            form_state = get_form_state(soup)
            league_html = fetch_post(url, {
                **form_state,
                "__EVENTTARGET": "ctl00$ContentPlaceHolder1$PlayerFormView$ShowLeaguePanelButton",
                "__EVENTARGUMENT": "",
            })
            league_soup = BeautifulSoup(league_html, "html.parser")
            profile["leagues"] = _parse_league_rows(league_soup)
        except Exception as exc:
            print(f"[player-profile] leagues fetch failed: {exc}")
            profile["leagues"] = []
    else:
        profile["leagues"] = []

    return profile


def _parse_league_rows(soup) -> list:
    """Parse the leagues panel that appears after ShowLeaguePanelButton postback."""
    # After the postback, look for any table that appeared with league data.
    # Common IDs: LeaguesGridView, LeagueGamesGridView, or similar.
    LEAGUE_RE = re.compile(r"League|Leagu|ליג", re.I)
    table = soup.find("table", id=LEAGUE_RE)
    if not table:
        # Fallback: any table whose headers contain league-like columns
        for t in soup.find_all("table"):
            headers = [clean_text(th) for th in t.find_all("th")]
            if any("ליגה" in h or "מחזור" in h or "קבוצה" in h for h in headers):
                table = t
                break
    if not table:
        return []
    leagues = []
    headers = [clean_text(th) for th in table.find_all("th")]
    for tr in table.find_all("tr")[1:]:
        cells = [clean_text(td) for td in tr.find_all("td", recursive=False)]
        if not cells or len(cells) < 2:
            continue
        row = {headers[i]: cells[i] for i in range(min(len(headers), len(cells)))} if headers else {}
        row["_raw"] = cells
        leagues.append(row)
    return leagues


def _parse_tourn_rows(tourn_table) -> tuple:
    """Return (list_of_tournament_dicts, max_page_number)."""
    tournaments = []
    max_page = 1
    if not tourn_table:
        return tournaments, max_page
    for tr in tourn_table.find_all("tr")[1:]:
        # Use recursive=False to avoid picking up TDs from nested pager tables
        cells = [clean_text(td) for td in tr.find_all("td", recursive=False)]
        if not cells:
            continue
        # Pager row has exactly 1 direct TD (colspan spanning all columns)
        if len(cells) == 1:
            for a in tr.find_all("a"):
                txt = a.get_text(strip=True)
                if txt.isdigit():
                    max_page = max(max_page, int(txt))
            continue
        if len(cells) < 3 or not cells[0]:
            continue
        rc_raw = cells[7].strip() if len(cells) > 7 else ""
        rc_num = None
        m = re.search(r"([\d.]+)([+-])$", rc_raw)
        if m:
            rc_num = float(m.group(1)) if m.group(2) == "+" else -float(m.group(1))
        elif re.fullmatch(r"-?\d+(\.\d+)?", rc_raw):
            rc_num = float(rc_raw)
        tournaments.append({
            "date":            cells[0],
            "name":            cells[2] if len(cells) > 2 else "",
            "games":           cells[3] if len(cells) > 3 else "",
            "points":          cells[4] if len(cells) > 4 else "",
            "performance":     cells[5] if len(cells) > 5 else "",
            "result":          cells[6] if len(cells) > 6 else "",
            "ratingChange":    rc_num,
            "ratingChangeRaw": rc_raw,
        })
    return tournaments, max_page


@app.get("/api/player-profile")
def player_profile(fedId: int = Query(...)):
    """Fetch and parse a player profile from chess.org.il (all tournament pages)."""
    url = f"https://www.chess.org.il/Players/Player.aspx?Id={fedId}"
    try:
        html = fetch_url(url)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    data = parse_player_profile(html, fedId, url=url)
    return JSONResponse(content=data)


@app.get("/api/debug-player")
def debug_player(fedId: int = Query(...)):
    """Return raw table/heading structure for a player page — for development."""
    url = f"https://www.chess.org.il/Players/Player.aspx?Id={fedId}"
    try:
        html = fetch_url(url)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    soup = BeautifulSoup(html, "html.parser")
    headings = [clean_text(h) for h in soup.find_all(["h1", "h2", "h3"]) if clean_text(h)]
    tables = []
    for t in soup.find_all("table"):
        tid = t.get("id", "")
        headers = [clean_text(th) for th in t.find_all("th")]
        rows = [[clean_text(td) for td in tr.find_all("td")] for tr in t.find_all("tr") if tr.find("td")]
        tables.append({"id": tid, "headers": headers, "rows": rows[:5]})
    return JSONResponse(content={"headings": headings, "tables": tables})


@app.get("/api/debug-player-links")
def debug_player_links(fedId: int = Query(...)):
    """Return all links on a player page — to find tab URLs."""
    url = f"https://www.chess.org.il/Players/Player.aspx?Id={fedId}"
    try:
        html = fetch_url(url)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    soup = BeautifulSoup(html, "html.parser")
    links = [{"text": a.get_text(strip=True), "href": a.get("href",""), "onclick": a.get("onclick","")}
             for a in soup.find_all("a") if a.get_text(strip=True)]
    return JSONResponse(content={"links": links})


@app.get("/api/debug-rating-table")
def debug_rating_table(fedId: int = Query(...)):
    """Show raw rating table after ShowRatingButton postback."""
    url = f"https://www.chess.org.il/Players/Player.aspx?Id={fedId}"
    try:
        html = fetch_url(url)
        soup = BeautifulSoup(html, "html.parser")
        form_state = get_form_state(soup)
        rating_html = fetch_post(url, {
            **form_state,
            "__EVENTTARGET": "ctl00$ContentPlaceHolder1$PlayerFormView$ShowRatingButton",
            "__EVENTARGUMENT": "",
        })
        rsoup = BeautifulSoup(rating_html, "html.parser")
        tables = []
        for t in rsoup.find_all("table"):
            headers = [clean_text(th) for th in t.find_all("th")]
            rows = [[clean_text(td) for td in tr.find_all("td", recursive=False)] for tr in t.find_all("tr") if tr.find("td")]
            tables.append({"id": t.get("id",""), "headers": headers, "rows": rows[:10]})
        return JSONResponse(content={"tables": tables})
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok"}
