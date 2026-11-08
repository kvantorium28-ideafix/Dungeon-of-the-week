# всё про героев и задания. нужно и сайту, и боту
import secrets
import sqlite3
from datetime import date, datetime, timedelta

from . import config, game, guide, planner

MONTHS_SHORT = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"]
WINDOW_DAYS = 7  # дней на карте


class NotFound(Exception):
    pass


def now() -> datetime:
    return datetime.now(config.TZ)


def today() -> date:
    return now().date()


def _new_link_code(conn: sqlite3.Connection) -> str:
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # без 0, O, 1, I чтобы не путать
    while True:
        code = "".join(secrets.choice(alphabet) for _ in range(6))
        if not conn.execute("SELECT 1 FROM heroes WHERE link_code = ?", (code,)).fetchone():
            return code


def create_hero(conn: sqlite3.Connection, name: str, gender: str = "m") -> sqlite3.Row:
    if gender not in game.GENDERS:
        raise ValueError("Пол: m или f")
    token = secrets.token_urlsafe(24)
    conn.execute(
        "INSERT INTO heroes (name, gender, token, link_code, created_at) VALUES (?, ?, ?, ?, ?)",
        (name.strip()[:40] or "Герой", gender, token, _new_link_code(conn), now().isoformat()),
    )
    return hero_by_token(conn, token)


def hero_by_token(conn: sqlite3.Connection, token: str) -> sqlite3.Row:
    row = conn.execute("SELECT * FROM heroes WHERE token = ?", (token,)).fetchone()
    if not row:
        raise NotFound("hero")
    return row


def hero_by_max_user(conn: sqlite3.Connection, max_user_id: int) -> sqlite3.Row | None:
    return conn.execute("SELECT * FROM heroes WHERE max_user_id = ?", (max_user_id,)).fetchone()


def link_max_user(conn: sqlite3.Connection, code: str, max_user_id: int) -> sqlite3.Row | None:
    row = conn.execute("SELECT * FROM heroes WHERE link_code = ?", (code.strip().upper(),)).fetchone()
    if not row:
        return None
    # один аккаунт MAX - один герой
    conn.execute("UPDATE heroes SET max_user_id = NULL WHERE max_user_id = ?", (max_user_id,))
    conn.execute("UPDATE heroes SET max_user_id = ? WHERE id = ?", (max_user_id, row["id"]))
    return conn.execute("SELECT * FROM heroes WHERE id = ?", (row["id"],)).fetchone()


def update_hero(conn: sqlite3.Connection, hero: sqlite3.Row, name=None, skin=None, pet=None,
                gender=None, weapon=None) -> None:
    hero = conn.execute("SELECT * FROM heroes WHERE id = ?", (hero["id"],)).fetchone()
    lvl = game.level_for(hero["xp"])
    if gender is not None:
        if gender not in game.GENDERS:
            raise ValueError("Пол: m или f")
        conn.execute("UPDATE heroes SET gender = ? WHERE id = ?", (gender, hero["id"]))
    if weapon is not None:
        item = next((w for w in weapons(conn, hero["id"]) if w["id"] == weapon), None)
        if not item or not item["unlocked"]:
            raise ValueError("Это оружие ещё не открыто")
        conn.execute("UPDATE heroes SET weapon = ? WHERE id = ?", (weapon, hero["id"]))
    if name is not None and name.strip():
        conn.execute("UPDATE heroes SET name = ? WHERE id = ?", (name.strip()[:40], hero["id"]))
    if skin is not None:
        item = next((s for s in game.SKINS if s["id"] == skin), None)
        if not item or item["level"] > lvl:
            raise ValueError("Эта броня ещё не открыта")
        conn.execute("UPDATE heroes SET skin = ? WHERE id = ?", (skin, hero["id"]))
    if pet is not None:
        item = next((p for p in game.PETS if p["id"] == pet), None)
        if not item or item["level"] > lvl:
            raise ValueError("Этот питомец ещё не открыт")
        conn.execute("UPDATE heroes SET pet = ? WHERE id = ?", (pet, hero["id"]))


def rest_days(conn: sqlite3.Connection, hero_id: int) -> set[date]:
    rows = conn.execute("SELECT day FROM rest_days WHERE hero_id = ?", (hero_id,)).fetchall()
    return {date.fromisoformat(r["day"]) for r in rows}


def toggle_rest(conn: sqlite3.Connection, hero_id: int, day: date) -> None:
    exists = conn.execute("SELECT 1 FROM rest_days WHERE hero_id = ? AND day = ?",
                          (hero_id, day.isoformat())).fetchone()
    if exists:
        conn.execute("DELETE FROM rest_days WHERE hero_id = ? AND day = ?", (hero_id, day.isoformat()))
    else:
        conn.execute("INSERT INTO rest_days (hero_id, day) VALUES (?, ?)", (hero_id, day.isoformat()))
    replan(conn, hero_id)


KIND_IDS = set(game.KINDS)


def create_task(conn: sqlite3.Connection, hero_id: int, title: str, kind: str,
                subject: str, deadline: date) -> int:
    if kind not in KIND_IDS:
        raise ValueError("Неизвестный вид монстра")
    title = title.strip()[:120] or game.KINDS[kind]["name"]
    cur = conn.execute(
        "INSERT INTO tasks (hero_id, title, subject, kind, deadline, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (hero_id, title, subject.strip()[:40], kind, deadline.isoformat(), now().isoformat()),
    )
    task_id = cur.lastrowid
    possible = planner.trainings_possible(today(), deadline, rest_days(conn, hero_id))
    _make_steps(conn, task_id, kind, title, subject, possible)
    replan(conn, hero_id)
    return task_id


def _make_steps(conn, task_id, kind, title, subject, possible) -> None:
    conn.execute("DELETE FROM steps WHERE task_id = ?", (task_id,))
    for idx, (name, is_battle) in enumerate(game.steps_for(kind, title, subject, possible)):
        conn.execute("INSERT INTO steps (task_id, idx, name, is_battle) VALUES (?, ?, ?, ?)",
                     (task_id, idx, name, int(is_battle)))


def _own_task(conn: sqlite3.Connection, hero_id: int, task_id: int) -> sqlite3.Row:
    row = conn.execute("SELECT * FROM tasks WHERE id = ? AND hero_id = ?", (task_id, hero_id)).fetchone()
    if not row:
        raise NotFound("task")
    return row


def update_task(conn: sqlite3.Connection, hero_id: int, task_id: int, title: str | None = None,
                deadline: date | None = None, kind: str | None = None, subject: str | None = None) -> None:
    task = _own_task(conn, hero_id, task_id)
    if title is not None and title.strip():
        conn.execute("UPDATE tasks SET title = ? WHERE id = ?", (title.strip()[:120], task_id))
    if deadline is not None:
        conn.execute("UPDATE tasks SET deadline = ? WHERE id = ?", (deadline.isoformat(), task_id))
    if subject is not None:
        conn.execute("UPDATE tasks SET subject = ? WHERE id = ?", (subject.strip()[:40], task_id))
    if kind is not None and kind != task["kind"]:
        if kind not in KIND_IDS:
            raise ValueError("Неизвестный вид монстра")
        if conn.execute("SELECT 1 FROM steps WHERE task_id = ? AND done_at IS NOT NULL", (task_id,)).fetchone():
            raise ValueError("По монстру уже были удары, вид поменять нельзя. Отмени удары или создай новое задание.")
        conn.execute("UPDATE tasks SET kind = ? WHERE id = ?", (kind, task_id))
    if kind is not None or subject is not None:
        t = _own_task(conn, hero_id, task_id)
        if not conn.execute("SELECT 1 FROM steps WHERE task_id = ? AND done_at IS NOT NULL", (task_id,)).fetchone():
            possible = planner.trainings_possible(today(), date.fromisoformat(t["deadline"]), rest_days(conn, hero_id))
            _make_steps(conn, task_id, t["kind"], t["title"], t["subject"], possible)
    replan(conn, hero_id)


def delete_task(conn: sqlite3.Connection, hero_id: int, task_id: int) -> None:
    _own_task(conn, hero_id, task_id)
    conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    replan(conn, hero_id)


def _step_with_task(conn: sqlite3.Connection, hero_id: int, step_id: int) -> tuple[sqlite3.Row, sqlite3.Row]:
    step = conn.execute("SELECT * FROM steps WHERE id = ?", (step_id,)).fetchone()
    if not step:
        raise NotFound("step")
    task = _own_task(conn, hero_id, step["task_id"])
    return step, task


def _add_xp(conn: sqlite3.Connection, hero_id: int, delta: int) -> None:
    conn.execute("UPDATE heroes SET xp = MAX(0, xp + ?) WHERE id = ?", (delta, hero_id))


def hit_step(conn: sqlite3.Connection, hero_id: int, step_id: int) -> dict:
    # удар по шагу
    step, task = _step_with_task(conn, hero_id, step_id)
    if step["done_at"]:
        return {"xp": 0, "victory": False, "level_up": False}
    level_before = game.level_for(conn.execute("SELECT xp FROM heroes WHERE id = ?", (hero_id,)).fetchone()["xp"])
    tiers_before = {w["id"]: w["tier"] for w in weapons(conn, hero_id)}
    group = game.group_of(task["subject"])
    skill_before = game.skill_level(skill_xp(conn, hero_id).get(group, 0)) if group else 0

    stamp = now().isoformat()
    conn.execute("UPDATE steps SET done_at = ? WHERE id = ?", (stamp, step_id))
    xp = game.XP_PER_STEP[task["kind"]]
    left = conn.execute("SELECT COUNT(*) AS n FROM steps WHERE task_id = ? AND done_at IS NULL",
                        (task["id"],)).fetchone()["n"]
    victory = left == 0
    if victory:
        xp += game.XP_VICTORY[task["kind"]]
        conn.execute("UPDATE tasks SET done_at = ? WHERE id = ?", (stamp, task["id"]))
    _add_xp(conn, hero_id, xp)
    replan(conn, hero_id)

    level_after = game.level_for(conn.execute("SELECT xp FROM heroes WHERE id = ?", (hero_id,)).fetchone()["xp"])
    skill_up = None
    if group:
        lvl = game.skill_level(skill_xp(conn, hero_id).get(group, 0))
        if lvl > skill_before:
            skill_up = {"name": game.GROUPS[group][0], "level": lvl}
    # новое или улучшенное оружие
    weapon_up = [{"id": w["id"], "name": w["name"], "tier": w["tier"]}
                 for w in weapons(conn, hero_id) if w["tier"] > tiers_before[w["id"]]]
    return {"xp": xp, "victory": victory, "level_up": level_after > level_before,
            "level": level_after, "task_id": task["id"], "kind": task["kind"],
            "skill_up": skill_up, "weapon_up": weapon_up}


def undo_step(conn: sqlite3.Connection, hero_id: int, step_id: int) -> None:
    # отмена удара, опыт забираем
    step, task = _step_with_task(conn, hero_id, step_id)
    if not step["done_at"]:
        return
    xp = game.XP_PER_STEP[task["kind"]]
    if task["done_at"]:
        xp += game.XP_VICTORY[task["kind"]]
        conn.execute("UPDATE tasks SET done_at = NULL WHERE id = ?", (task["id"],))
    conn.execute("UPDATE steps SET done_at = NULL WHERE id = ?", (step_id,))
    _add_xp(conn, hero_id, -xp)
    fix_gear(conn, hero_id)
    replan(conn, hero_id)


def skill_xp(conn: sqlite3.Connection, hero_id: int) -> dict[str, int]:
    # опыт навыков считаем по сделанным шагам, тогда отмена тоже работает
    rows = conn.execute(
        """SELECT t.subject, t.kind, t.done_at AS task_done, COUNT(s.id) AS n
           FROM tasks t JOIN steps s ON s.task_id = t.id
           WHERE t.hero_id = ? AND s.done_at IS NOT NULL GROUP BY t.id""", (hero_id,)).fetchall()
    out: dict[str, int] = {}
    for r in rows:
        g = game.group_of(r["subject"])
        if not g:
            continue
        xp = r["n"] * game.XP_PER_STEP[r["kind"]] + (game.XP_VICTORY[r["kind"]] if r["task_done"] else 0)
        out[g] = out.get(g, 0) + xp
    return out


def weapons(conn: sqlite3.Connection, hero_id: int) -> list[dict]:
    xp = conn.execute("SELECT xp FROM heroes WHERE id = ?", (hero_id,)).fetchone()["xp"]
    return game.weapons_unlocked(skill_xp(conn, hero_id), game.level_for(xp))


def fix_gear(conn: sqlite3.Connection, hero_id: int) -> list[str]:
    # если уровень упал, снимаем вещи которые снова закрыты
    hero = conn.execute("SELECT * FROM heroes WHERE id = ?", (hero_id,)).fetchone()
    lvl = game.level_for(hero["xp"])
    removed = []
    skin = next((s for s in game.SKINS if s["id"] == hero["skin"]), None)
    if not skin or skin["level"] > lvl:
        conn.execute("UPDATE heroes SET skin = 'blue' WHERE id = ?", (hero_id,))
        if skin:
            removed.append(skin["name"])
    pet = next((p for p in game.PETS if p["id"] == hero["pet"]), None)
    if not pet or pet["level"] > lvl:
        conn.execute("UPDATE heroes SET pet = '' WHERE id = ?", (hero_id,))
        if pet:
            removed.append(pet["name"])
    weapon = next((w for w in weapons(conn, hero_id) if w["id"] == hero["weapon"]), None)
    if not weapon or not weapon["unlocked"]:
        conn.execute("UPDATE heroes SET weapon = 'sword' WHERE id = ?", (hero_id,))
        if weapon:
            removed.append(weapon["name"])
    return removed


def _local_date(stamp: str) -> date:
    return datetime.fromisoformat(stamp).astimezone(config.TZ).date()


def replan(conn: sqlite3.Connection, hero_id: int) -> None:
    # заново раскладываем шаги, вызываем после каждого изменения
    t_rows = conn.execute("SELECT * FROM tasks WHERE hero_id = ? AND done_at IS NULL", (hero_id,)).fetchall()
    tasks = []
    for t in t_rows:
        steps = conn.execute("SELECT * FROM steps WHERE task_id = ? ORDER BY idx", (t["id"],)).fetchall()
        tasks.append({
            "id": t["id"], "kind": t["kind"], "deadline": date.fromisoformat(t["deadline"]),
            "steps": [{"id": s["id"], "is_battle": bool(s["is_battle"]),
                       "done_on": _local_date(s["done_at"]) if s["done_at"] else None} for s in steps],
        })
    # сделанные шаги тоже занимают место в дне
    done_today = conn.execute(
        """SELECT s.done_at FROM steps s JOIN tasks t ON t.id = s.task_id
           WHERE t.hero_id = ? AND t.done_at IS NOT NULL AND s.done_at IS NOT NULL AND s.is_battle = 0""",
        (hero_id,),
    ).fetchall()
    tasks.append({"id": -1, "kind": "slime", "deadline": date.min,
                  "steps": [{"id": -1, "is_battle": False, "done_on": _local_date(r["done_at"])} for r in done_today]})

    result = planner.plan(tasks, today(), rest_days(conn, hero_id), config.STAMINA_PER_DAY)
    for step_id, d in result.items():
        if step_id > 0:
            conn.execute("UPDATE steps SET planned_date = ? WHERE id = ?",
                         (d.isoformat() if d else None, step_id))


def _task_json(t: sqlite3.Row, steps: list[sqlite3.Row], today_: date) -> dict:
    total = len(steps)
    done = [s for s in steps if s["done_at"]]
    trainings = [s for s in steps if not s["is_battle"]]
    trainings_done = [s for s in trainings if s["done_at"]]
    if t["done_at"]:
        status = "done"
    elif date.fromisoformat(t["deadline"]) < today_:
        status = "fog"
    else:
        status = "active"
    weakened = round(100 * len(trainings_done) / total) if t["kind"] in game.WITH_BATTLE and total else 0
    return {
        "id": t["id"], "title": t["title"], "subject": t["subject"], "kind": t["kind"],
        "kind_name": game.KINDS[t["kind"]]["name"], "deadline": t["deadline"], "status": status,
        "hp_total": total, "hp_left": total - len(done), "weakened": weakened,
        "done_at": t["done_at"],
        "steps": [{"id": s["id"], "name": s["name"], "planned_date": s["planned_date"],
                   "done": bool(s["done_at"]), "is_battle": bool(s["is_battle"]),
                   "done_on": _local_date(s["done_at"]).isoformat() if s["done_at"] else None}
                  for s in steps],
        "trainings_total": len(trainings), "trainings_done": len(trainings_done),
    }


def state(conn: sqlite3.Connection, hero: sqlite3.Row) -> dict:
    today_ = today()
    removed = fix_gear(conn, hero["id"])
    hero = conn.execute("SELECT * FROM heroes WHERE id = ?", (hero["id"],)).fetchone()
    week_ago = (today_ - timedelta(days=7)).isoformat()
    t_rows = conn.execute(
        """SELECT * FROM tasks WHERE hero_id = ?
           AND (done_at IS NULL OR substr(done_at, 1, 10) >= ?) ORDER BY deadline, id""",
        (hero["id"], week_ago),
    ).fetchall()
    tasks = []
    for t in t_rows:
        steps = conn.execute("SELECT * FROM steps WHERE task_id = ? ORDER BY idx", (t["id"],)).fetchall()
        tasks.append(_task_json(t, steps, today_))

    rest = rest_days(conn, hero["id"])
    cap = config.STAMINA_PER_DAY
    days = []
    for i in range(WINDOW_DAYS):
        d = today_ + timedelta(days=i)
        iso = d.isoformat()
        items = []
        for t in tasks:
            for s in t["steps"]:
                on_day = s["done_on"] == iso if s["done"] else s["planned_date"] == iso
                if on_day and (t["status"] != "fog"):
                    items.append({"step_id": s["id"], "task_id": t["id"], "kind": t["kind"],
                                  "title": t["title"], "subject": t["subject"], "step": s["name"],
                                  "done": s["done"], "is_battle": s["is_battle"],
                                  "is_training": t["kind"] in game.WITH_BATTLE and not s["is_battle"]})
        items.sort(key=lambda x: (x["done"], x["is_battle"]))
        used = len([x for x in items if not x["is_battle"]])
        days.append({
            "date": iso,
            "weekday": guide.WEEKDAY_SHORT[d.weekday()],
            "label": f"{d.day} {MONTHS_SHORT[d.month - 1]}",
            "is_today": i == 0,
            "rest": d in rest,
            "items": items,
            "deadlines": [{"task_id": t["id"], "kind": t["kind"], "title": t["title"]}
                          for t in tasks if t["deadline"] == iso and t["status"] == "active"],
            "used": used, "capacity": cap, "overload": used > cap,
        })

    lvl = game.level_for(hero["xp"])
    sxp = skill_xp(conn, hero["id"])
    weapon_list = game.weapons_unlocked(sxp, lvl)
    skills = sorted((game.skill_info(g, sxp.get(g, 0)) for g in game.GROUPS), key=lambda x: -x["xp"])
    result = {
        "today": today_.isoformat(),
        "hero": {
            "name": hero["name"], "xp": hero["xp"], "level": lvl,
            "xp_in_level": hero["xp"] % game.XP_PER_LEVEL, "xp_per_level": game.XP_PER_LEVEL,
            "skin": hero["skin"], "pet": hero["pet"], "gender": hero["gender"], "weapon": hero["weapon"],
            "link_code": hero["link_code"], "linked": hero["max_user_id"] is not None,
            "skins": game.unlocked(game.SKINS, hero["xp"]),
            "pets": game.unlocked(game.PETS, hero["xp"]),
            "weapons": weapon_list,
            "weapon_tier": next((w["tier"] for w in weapon_list if w["id"] == hero["weapon"]), 1),
            "skills": skills,
        },
        "removed_gear": removed,
        "subjects": [s for _, (_, subjects) in game.GROUPS.items() for s in subjects],
        "stamina": {"capacity": cap, "used": days[0]["used"]},
        "days": days,
        "tasks": tasks,
        "kinds": game.KINDS,
    }
    result["week"] = week_summary(conn, hero["id"], today_)
    result["guide"] = guide.messages(result)
    return result


def week_summary(conn: sqlite3.Connection, hero_id: int, today_: date) -> dict:
    # итоги за 7 дней
    start = today_ - timedelta(days=6)
    rows = conn.execute(
        """SELECT s.done_at, t.kind FROM steps s JOIN tasks t ON t.id = s.task_id
           WHERE t.hero_id = ? AND s.done_at IS NOT NULL""", (hero_id,)).fetchall()
    steps = [(_local_date(r["done_at"]), r["kind"]) for r in rows]
    steps = [(d, k) for d, k in steps if start <= d <= today_]

    done = conn.execute("SELECT kind, done_at FROM tasks WHERE hero_id = ? AND done_at IS NOT NULL",
                        (hero_id,)).fetchall()
    defeated = {k: 0 for k in game.KINDS}
    for r in done:
        if start <= _local_date(r["done_at"]) <= today_:
            defeated[r["kind"]] += 1

    xp = sum(game.XP_PER_STEP[k] for _, k in steps) + sum(game.XP_VICTORY[k] * n for k, n in defeated.items())

    per_day: dict[date, int] = {}
    for d, _ in steps:
        per_day[d] = per_day.get(d, 0) + 1
    best = max(per_day.items(), key=lambda x: x[1]) if per_day else None

    bosses = []
    for t in conn.execute(
        "SELECT * FROM tasks WHERE hero_id = ? AND kind = 'boss' AND deadline BETWEEN ? AND ? ORDER BY deadline",
        (hero_id, start.isoformat(), (today_ + timedelta(days=3)).isoformat()),
    ).fetchall():
        st = conn.execute("SELECT * FROM steps WHERE task_id = ?", (t["id"],)).fetchall()
        tr = [x for x in st if not x["is_battle"]]
        weak = round(100 * len([x for x in tr if x["done_at"]]) / len(st)) if st else 0
        bosses.append({"id": t["id"], "title": t["title"], "deadline": t["deadline"],
                       "weakened": weak, "done": t["done_at"] is not None})

    return {
        "from": start.isoformat(), "to": today_.isoformat(),
        "steps": len(steps), "xp": xp,
        "defeated": defeated, "defeated_total": sum(defeated.values()),
        "best_day": {"date": best[0].isoformat(), "steps": best[1]} if best else None,
        "bosses": bosses,
    }
