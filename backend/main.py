from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from curl_cffi import requests as cf_requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

ALLOWED_DOMAIN = "chess.org.il"

@app.get("/proxy")
def proxy(url: str = Query(...)):
    if ALLOWED_DOMAIN not in url:
        raise HTTPException(status_code=403, detail="Domain not allowed")
    try:
        resp = cf_requests.get(
            url,
            impersonate="firefox120",
            timeout=30,
            headers={
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1",
            }
        )
        return HTMLResponse(content=resp.text, status_code=resp.status_code)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "ok"}