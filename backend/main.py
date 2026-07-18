import json
from pathlib import Path
from threading import Lock

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BASE_DIR = Path(__file__).parent
ITEMS_PATH = BASE_DIR / "data" / "items.json"
PROGRESS_PATH = BASE_DIR / "data" / "progress.json"

app = FastAPI(title="DS1 Checklist API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_lock = Lock()


def _load_items():
    with open(ITEMS_PATH, encoding="utf-8") as f:
        return json.load(f)


def _load_progress():
    if not PROGRESS_PATH.exists():
        return {}
    with open(PROGRESS_PATH, encoding="utf-8") as f:
        return json.load(f)


def _save_progress(progress: dict):
    with _lock:
        with open(PROGRESS_PATH, "w", encoding="utf-8") as f:
            json.dump(progress, f, ensure_ascii=False, indent=2)


class ProgressUpdate(BaseModel):
    progress: dict[str, bool]


@app.get("/api/items")
def get_items():
    return _load_items()


@app.get("/api/progress")
def get_progress():
    return _load_progress()


@app.put("/api/progress")
def put_progress(payload: ProgressUpdate):
    _save_progress(payload.progress)
    return {"ok": True, "count": len(payload.progress)}


@app.get("/api/health")
def health():
    return {"status": "ok"}
