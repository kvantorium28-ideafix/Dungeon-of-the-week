from collections import Counter
from datetime import date, timedelta

from app.planner import plan

MONDAY = date(2026, 10, 19)


def task(tid, kind, deadline, n_steps, battle=False, done=()):
    steps = [{"id": tid * 100 + i, "is_battle": False, "done_on": None} for i in range(n_steps)]
    for i in done:
        steps[i]["done_on"] = MONDAY
    if battle:
        steps.append({"id": tid * 100 + 99, "is_battle": True, "done_on": None})
    return {"id": tid, "kind": kind, "deadline": deadline, "steps": steps}


def test_steps_finish_before_deadline_and_in_order():
    t = task(1, "troll", MONDAY + timedelta(days=4), 5)
    res = plan([t], MONDAY, set(), 4)
    dates = [res[s["id"]] for s in t["steps"]]
    assert dates == sorted(dates)
    assert max(dates) <= MONDAY + timedelta(days=3)  # за день до срока
    assert min(dates) == MONDAY


def test_boss_battle_on_deadline_trainings_before():
    t = task(2, "boss", MONDAY + timedelta(days=4), 3, battle=True)
    res = plan([t], MONDAY, set(), 4)
    assert res[299] == MONDAY + timedelta(days=4)
    assert all(res[200 + i] < MONDAY + timedelta(days=4) for i in range(3))


def test_stamina_is_respected():
    tasks = [task(i, "goblin", MONDAY + timedelta(days=3), 2) for i in range(1, 6)]  # 10 ударов
    res = plan(tasks, MONDAY, set(), 4)
    per_day = Counter(res.values())
    assert max(per_day.values()) <= 4


def test_rest_day_is_free():
    rest = {MONDAY + timedelta(days=1)}
    t = task(3, "troll", MONDAY + timedelta(days=4), 5)
    res = plan([t], MONDAY, rest, 4)
    assert MONDAY + timedelta(days=1) not in res.values()


def test_overdue_task_goes_to_fog():
    t = task(4, "goblin", MONDAY - timedelta(days=1), 2)
    res = plan([t], MONDAY, set(), 4)
    assert all(v is None for v in res.values())


def test_done_steps_use_todays_stamina():
    done_task = task(5, "troll", MONDAY + timedelta(days=5), 4, done=(0, 1, 2, 3))
    t = task(6, "slime", MONDAY + timedelta(days=5), 1)
    res = plan([done_task, t], MONDAY, set(), 4)
    assert res[600] != MONDAY  # сегодня силы уже потрачены
