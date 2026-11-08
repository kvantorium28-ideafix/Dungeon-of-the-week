from datetime import datetime, timedelta

from app import config, db, services
from bot import logic

USER = 777001


def setup_hero(conn, user_id=USER):
    hero = services.create_hero(conn, "Даша")
    out = logic.handle_update(conn, {"update_type": "message_created",
                                     "message": {"sender": {"user_id": user_id}, "body": {"text": hero["link_code"]}}})
    assert "Готово" in out[0]["text"]
    return services.hero_by_max_user(conn, user_id)


def msg(text, user_id=USER):
    return {"update_type": "message_created", "message": {"sender": {"user_id": user_id}, "body": {"text": text}}}


def test_unlinked_user_gets_instructions():
    db.init_db()
    with db.session() as conn:
        out = logic.handle_update(conn, msg("в пятницу контрольная", user_id=1))
    assert "код" in out[0]["text"]


def test_link_via_start_payload():
    db.init_db()
    with db.session() as conn:
        hero = services.create_hero(conn, "Соня")
        out = logic.handle_update(conn, {"update_type": "bot_started", "user": {"user_id": 5005},
                                         "payload": hero["link_code"]})
        assert "Соня" in out[0]["text"]
        assert services.hero_by_max_user(conn, 5005)["id"] == hero["id"]


def test_phrase_creates_tasks_and_hit_button_works():
    db.init_db()
    with db.session() as conn:
        hero = setup_hero(conn, user_id=USER)
        out = logic.handle_update(conn, msg("завтра выучить слова по английскому, через 3 дня доклад по истории"))
        text = out[0]["text"]
        assert "Слизень" in text and "Тролль" in text
        assert out[0]["buttons"][0][0]["type"] == "link"

        d = logic.handle_update(conn, msg("/today"))[0]
        hit_btn = d["buttons"][0][0]
        assert hit_btn["type"] == "callback" and hit_btn["payload"].startswith("hit:")

        res = logic.handle_update(conn, {"update_type": "message_callback",
                                         "callback": {"callback_id": "cb1", "payload": hit_btn["payload"],
                                                      "user": {"user_id": USER}}})
        assert res[0]["type"] == "answer" and "опыта" in res[0]["notification"]
        assert services.hero_by_max_user(conn, USER)["xp"] > 0


def test_reminders_respect_quiet_hours_and_send_once():
    db.init_db()
    with db.session() as conn:
        hero = setup_hero(conn, user_id=USER + 1)
        services.create_task(conn, hero["id"], "Контрольная по химии", "boss", "Химия", services.today())
        tz = config.TZ
        night = datetime.combine(services.today(), datetime.min.time(), tz).replace(hour=23)
        assert logic.due_reminders(conn, night) == []

        afternoon = night.replace(hour=max(config.DIGEST_HOUR, config.QUIET_TO))
        first = [a for a in logic.due_reminders(conn, afternoon) if a["user_id"] == USER + 1]
        assert any("битва" in a["text"].lower() for a in first)
        assert any("Сегодня в подземелье" in a["text"] for a in first)
        again = [a for a in logic.due_reminders(conn, afternoon + timedelta(minutes=5)) if a["user_id"] == USER + 1]
        assert again == []


def test_sunday_digest_has_week_summary():
    db.init_db()
    with db.session() as conn:
        hero = setup_hero(conn, user_id=USER + 2)
        today = services.today()
        services.create_task(conn, hero["id"], "Слова", "slime", "", today + timedelta(days=1))
        st = services.state(conn, hero)
        services.hit_step(conn, hero["id"], st["tasks"][0]["steps"][0]["id"])
        w = services.week_summary(conn, hero["id"], today)
        assert w["steps"] == 1 and w["defeated"]["slime"] == 1 and w["xp"] > 0

        sunday = today + timedelta(days=(6 - today.weekday()) % 7)
        at = datetime.combine(sunday, datetime.min.time(), config.TZ).replace(hour=max(config.DIGEST_HOUR, config.QUIET_TO))
        msgs = [a for a in logic.due_reminders(conn, at) if a["user_id"] == USER + 2]
        assert any("Итоги недели" in a["text"] for a in msgs)
