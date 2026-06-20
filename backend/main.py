from fastapi import FastAPI, Query, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
from curl_cffi import requests as cf_requests
from bs4 import BeautifulSoup
import asyncio
import re
import json
from concurrent.futures import ThreadPoolExecutor

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

def parse_team_matches(html: str, team: dict, fed_date: str) -> list:
    soup = BeautifulSoup(html, "html.parser")
    results = []
    for table in soup.find_all("table", id=re.compile(r"RoundsRepeter_ctl\d+_GamesGridView", re.I)):
        tbody = table.find("tbody")
        if not tbody:
            continue
        first_td = tbody.find("td")
        if not first_td or fed_date not in clean_text(first_td):
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
        home_score = float(home_score_raw) if re.search(r"[\d.]", home_score_raw) else None
        away_score = float(away_score_raw) if re.search(r"[\d.]", away_score_raw) else None
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
            "homeTeam": home_team,
            "awayTeam": away_team,
            "homeScore": home_score,
            "awayScore": away_score,
            "isPlayed": home_score is not None and away_score is not None,
            "timeSlot": time_slot,
        })
    return results


def fetch_team(team: dict, fed_date: str) -> tuple:
    url = f"https://www.chess.org.il/Tournaments/TeamInTournament.aspx?TeamId={team['teamId']}"
    try:
        html = fetch_url(url)
        matches = parse_team_matches(html, team, fed_date)
        status = "ok" if matches else "nodate"
        return team["name"], status, matches
    except Exception as e:
        return team["name"], "fail", []


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


# ── Health ─────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}
