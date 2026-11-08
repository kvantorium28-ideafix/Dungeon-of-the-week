# база данных
import os
import sqlite3
from contextlib import contextmanager

from . import config

SCHEMA = """
CREATE TABLE IF NOT EXISTS heroes (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    token        TEXT NOT NULL UNIQUE,      -- ключ для входа на сайт
    link_code    TEXT NOT NULL UNIQUE,      -- код привязки бота
    max_user_id  INTEGER UNIQUE,            -- id в MAX
    xp           INTEGER NOT NULL DEFAULT 0,
    skin         TEXT NOT NULL DEFAULT 'blue',
    pet          TEXT NOT NULL DEFAULT '',
    gender       TEXT NOT NULL DEFAULT 'm',
    weapon       TEXT NOT NULL DEFAULT 'sword',
    created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    hero_id     INTEGER NOT NULL REFERENCES heroes(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    subject     TEXT NOT NULL DEFAULT '',
    kind        TEXT NOT NULL,              -- slime | goblin | troll | boss
    deadline    TEXT NOT NULL,              -- ГГГГ-ММ-ДД
    created_at  TEXT NOT NULL,
    done_at     TEXT
);

CREATE TABLE IF NOT EXISTS steps (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id       INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    idx           INTEGER NOT NULL,
    name          TEXT NOT NULL,
    planned_date  TEXT,
    done_at       TEXT,
    is_battle     INTEGER NOT NULL DEFAULT 0 -- сама контрольная
);

CREATE TABLE IF NOT EXISTS rest_days (
    hero_id  INTEGER NOT NULL REFERENCES heroes(id) ON DELETE CASCADE,
    day      TEXT NOT NULL,
    PRIMARY KEY (hero_id, day)
);

CREATE TABLE IF NOT EXISTS sent_reminders (
    hero_id  INTEGER NOT NULL REFERENCES heroes(id) ON DELETE CASCADE,
    key      TEXT NOT NULL,                 -- digest:2026-10-22 и т.п.
    PRIMARY KEY (hero_id, key)
);

CREATE INDEX IF NOT EXISTS idx_tasks_hero ON tasks(hero_id);
CREATE INDEX IF NOT EXISTS idx_steps_task ON steps(task_id);
"""


def connect() -> sqlite3.Connection:
    folder = os.path.dirname(config.DB_PATH)
    if folder:
        os.makedirs(folder, exist_ok=True)
    conn = sqlite3.connect(config.DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")  # чтобы сайт и бот не мешали друг другу
    return conn


# новые колонки, добавляем их в старую базу
MIGRATIONS = {
    "heroes": [("gender", "TEXT NOT NULL DEFAULT 'm'"), ("weapon", "TEXT NOT NULL DEFAULT 'sword'")],
}


def init_db() -> None:
    with connect() as conn:
        conn.executescript(SCHEMA)
        for table, cols in MIGRATIONS.items():
            have = {r["name"] for r in conn.execute(f"PRAGMA table_info({table})")}
            for name, decl in cols:
                if name not in have:
                    conn.execute(f"ALTER TABLE {table} ADD COLUMN {name} {decl}")


@contextmanager
def session():
    conn = connect()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
