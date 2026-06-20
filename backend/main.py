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


def parse_team_roster(html: str) -> list:
    """Extract the official ordered player roster from the team page."""
    soup = BeautifulSoup(html, "html.parser")
    # Try known table ID patterns for the registered players table
    roster_table = (
        soup.find("table", id=re.compile(r"PlayersList|PlayersGridView|TeamPlayers|PlayersRepeater", re.I))
    )
    if not roster_table:
        return []
    players = []
    pos = 0
    for tr in roster_table.find_all("tr"):
        cells = tr.find_all("td")
        if not cells:
            continue  # header row
        pos += 1
        # Name is in a link, or first non-numeric text cell
        a = tr.find("a")
        name = clean_text(a) if a else None
        if not name:
            for c in cells:
                t = clean_text(c)
                if t and not re.match(r"^\d+$", t):
                    name = t
                    break
        if name:
            players.append({"position": pos, "name": name})
    return players


def parse_team_matches(html: str, team: dict) -> list:
    """Return all rounds for a team, each with its own date field (DD/MM/YYYY)."""
    soup = BeautifulSoup(html, "html.parser")
    results = []
    for table in soup.find_all("table", id=re.compile(r"RoundsRepeter_ctl\d+_GamesGridView", re.I)):
        match_date = find_date_near_table(table)
        if not match_date:
            continue
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


def aggregate_players(rounds: list, team_name: str, roster: list) -> list:
    """Aggregate per-player stats. Includes all roster members, sorted by roster position."""
    players: dict = {}

    # Seed all registered players (including those who never played)
    for r in roster:
        players[r["name"]] = {
            "name": r["name"], "position": r["position"],
            "games": 0, "wins": 0, "draws": 0, "losses": 0, "points": 0.0,
        }

    # Merge in game results
    for r in rounds:
        if not r.get("isPlayed"):
            continue
        is_home = r.get("homeTeam") == team_name
        for g in r.get("games", []):
            name = g["homePlayer"] if is_home else g["awayPlayer"]
            result = g["homeResult"] if is_home else g["awayResult"]
            if not name or result is None:
                continue
            if name not in players:
                # Played but not on roster (substitute etc.)
                players[name] = {"name": name, "position": 999, "games": 0, "wins": 0, "draws": 0, "losses": 0, "points": 0.0}
            p = players[name]
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
        if cached and now - cached["ts"] < CACHE_TTL:
            rounds = cached["rounds"]
            roster = cached.get("roster", [])
        else:
            html = fetch_url(url)
            rounds = parse_team_matches(html, team)
            roster = parse_team_roster(html)
            _team_cache[body.teamId] = {"rounds": rounds, "roster": roster, "ts": now}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    players = aggregate_players(rounds, body.teamName, roster)
    return JSONResponse(content={"players": players, "rounds": len(rounds)})


# ── Health ─────────────────────────────────────────────────────────────────────

@app.get("/api/debug-team")
def debug_team(teamId: int = Query(...)):
    """Return raw repeater HTML for a team page to inspect date location."""
    url = f"https://www.chess.org.il/Tournaments/TeamInTournament.aspx?TeamId={teamId}"
    try:
        html = fetch_url(url)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    soup = BeautifulSoup(html, "html.parser")
    tables = soup.find_all("table", id=re.compile(r"RoundsRepeter_ctl\d+_GamesGridView", re.I))
    snippets = []
    for t in tables[:3]:  # first 3 rounds only
        parent = t.parent
        snippets.append({
            "tableId": t.get("id"),
            "tableText": clean_text(t)[:300],
            "parentTag": parent.name if parent else None,
            "parentId": parent.get("id") if parent else None,
            "parentText": clean_text(parent)[:300] if parent else None,
        })
    return JSONResponse(content={"rounds": snippets, "totalTables": len(tables)})


@app.get("/health")
def health():
    return {"status": "ok"}
