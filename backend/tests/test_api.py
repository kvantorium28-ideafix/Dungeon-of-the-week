from datetime import timedelta

from fastapi.testclient import TestClient

from app import services
from app.main import app


def client_with_hero():
    client = TestClient(app)
    client.__enter__()  # запускает lifespan (создание таблиц)
    r = client.post("/api/heroes", json={"name": "Маша"})
    assert r.status_code == 200
    client.headers["X-Hero-Token"] = r.json()["token"]
    return client


def test_full_adventure():
    c = client_with_hero()
    today = services.today()

    drafts = c.post("/api/parse", json={"text": "контрольная по алгебре через 4 дня, доклад по истории через 3 дня"}).json()["drafts"]
    assert {d["kind"] for d in drafts} == {"boss", "troll"}

    state = c.post("/api/tasks", json={"tasks": drafts}).json()
    assert len(state["tasks"]) == 2
    assert len(state["days"]) == 7
    assert state["guide"], "картограф должен что-то сказать"

    boss = next(t for t in state["tasks"] if t["kind"] == "boss")
    assert boss["steps"][-1]["is_battle"]
    assert boss["steps"][-1]["planned_date"] == (today + timedelta(days=4)).isoformat()

    # добиваем тролля
    troll = next(t for t in state["tasks"] if t["kind"] == "troll")
    last = None
    for s in troll["steps"]:
        last = c.post(f"/api/steps/{s['id']}/hit").json()
    assert last["result"]["victory"]
    assert last["state"]["hero"]["xp"] > 0
    troll_after = next(t for t in last["state"]["tasks"] if t["id"] == troll["id"])
    assert troll_after["status"] == "done"

    # отмена забирает опыт и победу
    xp_before = last["state"]["hero"]["xp"]
    state = c.post(f"/api/steps/{troll['steps'][-1]['id']}/undo").json()
    assert state["hero"]["xp"] < xp_before
    assert next(t for t in state["tasks"] if t["id"] == troll["id"])["status"] == "active"

    # тренировка ослабляет босса
    state = c.post(f"/api/steps/{boss['steps'][0]['id']}/hit").json()["state"]
    assert next(t for t in state["tasks"] if t["id"] == boss["id"])["weakened"] > 0


def test_fog_and_new_deadline():
    c = client_with_hero()
    yesterday = (services.today() - timedelta(days=1)).isoformat()
    state = c.post("/api/tasks", json={"tasks": [
        {"title": "Упражнение 5", "kind": "goblin", "subject": "Русский язык", "deadline": yesterday}]}).json()
    t = state["tasks"][0]
    assert t["status"] == "fog"
    assert any(m["mood"] == "fog" for m in state["guide"])

    new = (services.today() + timedelta(days=2)).isoformat()
    state = c.patch(f"/api/tasks/{t['id']}", json={"deadline": new}).json()
    t = state["tasks"][0]
    assert t["status"] == "active"
    assert all(s["planned_date"] for s in t["steps"])


def test_rest_toggle_and_locked_skin():
    c = client_with_hero()
    day = services.today().isoformat()
    state = c.post(f"/api/rest/{day}").json()
    assert state["days"][0]["rest"]
    r = c.patch("/api/hero", json={"skin": "gold"})
    assert r.status_code == 400  # золотые доспехи с 8 уровня


def test_other_hero_cannot_touch_task():
    a = client_with_hero()
    b = client_with_hero()
    tomorrow = (services.today() + timedelta(days=1)).isoformat()
    state = a.post("/api/tasks", json={"tasks": [
        {"title": "Слова", "kind": "slime", "subject": "", "deadline": tomorrow}]}).json()
    tid = state["tasks"][0]["id"]
    assert b.delete(f"/api/tasks/{tid}").status_code == 404


def test_requires_token():
    c = TestClient(app)
    assert c.get("/api/state").status_code == 401


def hit_all(c, task):
    last = None
    for s in task["steps"]:
        last = c.post(f"/api/steps/{s['id']}/hit").json()
    return last


def test_gear_is_removed_when_level_drops():
    c = client_with_hero()
    soon = (services.today() + timedelta(days=4)).isoformat()
    state = c.post("/api/tasks", json={"tasks": [
        {"title": "Контрольная по алгебре", "kind": "boss", "subject": "Алгебра", "deadline": soon},
        {"title": "Доклад по истории", "kind": "troll", "subject": "История", "deadline": soon}]}).json()
    for t in state["tasks"]:
        state = hit_all(c, t)["state"]
    assert state["hero"]["level"] >= 2
    state = c.patch("/api/hero", json={"skin": "green", "pet": "bat"}).json()
    assert state["hero"]["skin"] == "green" and state["hero"]["pet"] == "bat"

    for t in state["tasks"]:
        for s in t["steps"]:
            state = c.post(f"/api/steps/{s['id']}/undo").json()
    assert state["hero"]["level"] == 1
    assert state["hero"]["skin"] == "blue" and state["hero"]["pet"] == ""


def test_skill_and_weapon_follow_steps():
    c = client_with_hero()
    soon = (services.today() + timedelta(days=4)).isoformat()
    state = c.post("/api/tasks", json={"tasks": [
        {"title": "Контрольная по алгебре", "kind": "boss", "subject": "Алгебра", "deadline": soon},
        {"title": "Проект по алгебре", "kind": "troll", "subject": "Алгебра", "deadline": soon}]}).json()
    for t in state["tasks"]:
        state = hit_all(c, t)["state"]
    math = next(s for s in state["hero"]["skills"] if s["id"] == "math")
    assert math["level"] >= 3
    ruler = next(w for w in state["hero"]["weapons"] if w["id"] == "ruler")
    assert ruler["unlocked"] and ruler["tier"] == 1
    state = c.patch("/api/hero", json={"weapon": "ruler"}).json()
    assert state["hero"]["weapon"] == "ruler"

    for t in state["tasks"]:
        for s in t["steps"]:
            state = c.post(f"/api/steps/{s['id']}/undo").json()
    assert next(s for s in state["hero"]["skills"] if s["id"] == "math")["level"] == 1
    assert state["hero"]["weapon"] == "sword"


def test_change_kind_rebuilds_steps():
    c = client_with_hero()
    soon = (services.today() + timedelta(days=3)).isoformat()
    state = c.post("/api/tasks", json={"tasks": [
        {"title": "Тест по истории", "kind": "boss", "subject": "История", "deadline": soon}]}).json()
    tid = state["tasks"][0]["id"]
    state = c.patch(f"/api/tasks/{tid}", json={"kind": "guard"}).json()
    t = state["tasks"][0]
    assert t["kind"] == "guard" and t["steps"][-1]["name"] == "Испытание: тест"


def test_girl_hero():
    c = TestClient(app)
    c.__enter__()
    r = c.post("/api/heroes", json={"name": "Аня", "gender": "f"}).json()
    assert r["state"]["hero"]["gender"] == "f"


def test_static_is_revalidated():
    r = client_with_hero().get("/js/app.js")
    assert r.status_code == 200
    assert r.headers["cache-control"] == "no-cache"
