# раскладываем шаги по дням (не больше 4 в день, в привал не ставим)
from collections import defaultdict
from datetime import date, timedelta


def day_range(start: date, end: date) -> list[date]:
    return [start + timedelta(days=i) for i in range((end - start).days + 1)]


def work_days(start: date, end: date, rest: set[date]) -> list[date]:
    # дни без привала
    days = day_range(start, end)
    free = [d for d in days if d not in rest]
    return free or days


def trainings_possible(today: date, deadline: date, rest: set[date]) -> int:
    # сколько дней есть до контрольной
    if deadline <= today:
        return 1
    return len([d for d in day_range(today, deadline - timedelta(days=1)) if d not in rest])


def plan(tasks: list[dict], today: date, rest: set[date], capacity: int) -> dict[int, date | None]:
    # возвращает step_id -> день
    load: dict[date, int] = defaultdict(int)
    result: dict[int, date | None] = {}

    # сделанные шаги тоже занимают место
    for t in tasks:
        for s in t["steps"]:
            if s["done_on"] is not None and not s["is_battle"]:
                load[s["done_on"]] += 1

    for t in sorted(tasks, key=lambda x: (x["deadline"], x["id"])):
        todo = [s for s in t["steps"] if s["done_on"] is None]
        if not todo:
            continue
        deadline = t["deadline"]

        if deadline < today:  # просрочено
            for s in todo:
                result[s["id"]] = None
            continue

        battles = [s for s in todo if s["is_battle"]]
        regular = [s for s in todo if not s["is_battle"]]
        for s in battles:
            result[s["id"]] = deadline

        # успеть за день до срока
        end = max(today, deadline - timedelta(days=1))
        days = work_days(today, end, rest)
        prev_idx = 0
        n = len(regular)
        for i, s in enumerate(regular):
            ideal = max(prev_idx, (i * len(days)) // n)
            idx = _pick_day(days, ideal, prev_idx, load, capacity)
            load[days[idx]] += 1
            result[s["id"]] = days[idx]
            prev_idx = idx
    return result


def _pick_day(days: list[date], ideal: int, lowest: int, load: dict, capacity: int) -> int:
    # сначала ищем день позже
    for idx in range(ideal, len(days)):
        if load[days[idx]] < capacity:
            return idx
    # потом раньше, но не раньше прошлого шага
    for idx in range(ideal - 1, lowest - 1, -1):
        if load[days[idx]] < capacity:
            return idx
    # всё занято, берём где меньше всего
    return min(range(lowest, len(days)), key=lambda k: (load[days[k]], k))

