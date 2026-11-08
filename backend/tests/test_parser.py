from datetime import date

from app.parser import parse

MONDAY = date(2026, 10, 19)


def test_two_tasks_with_weekdays():
    res = parse("в пятницу контрольная по алгебре, а в среду сдать доклад по истории", MONDAY)
    assert [(r["kind"], r["subject"], r["deadline"]) for r in res] == [
        ("boss", "Алгебра", "2026-10-23"),
        ("troll", "История", "2026-10-21"),
    ]
    assert res[0]["title"] == "Контрольная по алгебре"


def test_relative_dates():
    assert parse("завтра выучить слова по английскому", MONDAY)[0]["deadline"] == "2026-10-20"
    assert parse("послезавтра номера 5-7 по геометрии", MONDAY)[0]["deadline"] == "2026-10-21"
    assert parse("через 3 дня прочитать параграф", MONDAY)[0]["deadline"] == "2026-10-22"


def test_numeric_and_month_dates():
    assert parse("к 30.10 проект по информатике", MONDAY)[0]["deadline"] == "2026-10-30"
    assert parse("сочинение по литературе 2 ноября", MONDAY)[0]["deadline"] == "2026-11-02"
    # прошедшая дата -> следующий год
    assert parse("доклад 1 сентября", MONDAY)[0]["deadline"] == "2027-09-01"


def test_same_weekday_means_next_week():
    assert parse("в понедельник диктант", MONDAY)[0]["deadline"] == "2026-10-26"


def test_next_week():
    assert parse("в следующую среду самостоятельная по физике", MONDAY)[0]["deadline"] == "2026-10-28"


def test_shared_date_and_conjunction():
    res = parse("доклад по биологии и контрольная по химии в четверг", MONDAY)
    assert [r["kind"] for r in res] == ["troll", "boss"]
    assert all(r["deadline"] == "2026-10-22" for r in res)


def test_no_date_is_guessed():
    res = parse("домашка по физике", MONDAY)
    assert res[0]["kind"] == "goblin" and res[0]["date_guessed"]


def test_text_without_task_is_ignored():
    assert parse("привет, как дела", MONDAY) == []


def test_kind_gradation():
    kinds = {
        "в среду тест по истории": "guard",
        "контрольная по алгебре": "boss",
        "пробник ОГЭ по математике": "boss",
        "проверочная по химии": "boss",
        "словарный диктант": "boss",
        "пересказ рассказа по литературе": "guard",
        "выучить стих наизусть": "guard",
        "сдать тетради по русскому": "slime",
        "проверка домашки по физике": "slime",
        "доклад по истории": "troll",
        "прочитать параграф 5 по биологии": "goblin",
        "номера 5-7 по геометрии": "goblin",
    }
    for text, kind in kinds.items():
        assert parse(text, MONDAY)[0]["kind"] == kind, text


def test_subject_from_hint():
    assert parse("словарный диктант завтра", MONDAY)[0]["subject"] == "Русский язык"
    assert parse("выучить стих", MONDAY)[0]["subject"] == "Литература"
