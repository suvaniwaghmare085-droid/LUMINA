"""SQLite persistence for scan history."""
from pathlib import Path
import sqlite3
import json
from datetime import datetime, timezone

DB_PATH = Path(__file__).resolve().parent / "lumina.db"

def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with connect() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS scans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                input_type TEXT NOT NULL,
                input_text TEXT NOT NULL,
                risk_score INTEGER NOT NULL,
                risk_level TEXT NOT NULL,
                reasons_json TEXT NOT NULL
            )
        """)

def save_scan(input_type, input_text, result):
    with connect() as conn:
        cur = conn.execute(
            "INSERT INTO scans (created_at,input_type,input_text,risk_score,risk_level,reasons_json) VALUES (?,?,?,?,?,?)",
            (datetime.now(timezone.utc).isoformat(), input_type, input_text[:2048],
             result["risk_score"], result["risk_level"], json.dumps(result["reasons"]))
        )
        return cur.lastrowid

def get_history(limit=50):
    with connect() as conn:
        rows = conn.execute("SELECT * FROM scans ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
    return [{
        "id": row["id"], "created_at": row["created_at"],
        "input_type": row["input_type"], "input_text": row["input_text"],
        "risk_score": row["risk_score"], "risk_level": row["risk_level"],
        "reasons": json.loads(row["reasons_json"])
    } for row in rows]

def clear_history():
    with connect() as conn:
        conn.execute("DELETE FROM scans")
