# что говорит картограф
from datetime import date

from .game import KINDS, TRAINING_MINUTES

WEEKDAY_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
WEEKDAY_ACC = ["понедельник", "вторник", "среду", "четверг", "пятницу", "субботу", "воскресенье"]


def plural(n: int, one: str, few: str, many: str) -> str:
    n = abs(n)
    if n % 10 == 1 and n % 100 != 11:
        return one
    if 2 <= n % 10 <= 4 and not 12 <= n % 100 <= 14:
        return few
    return many


def when_text(d: date, today: date) -> str:
    delta = (d - today).days
    if delta == 0:
        return "сегодня"
    if delta == 1:
        return "завтра"
    if delta == 2:
        return "послезавтра"
    if 0 < delta < 7:
        return f"в {WEEKDAY_ACC[d.weekday()]}"
    if delta < 0:
        return f"{-delta} {plural(delta, 'день', 'дня', 'дней')} назад"
    return f"через {delta} {plural(delta, 'день', 'дня', 'дней')}"


def messages(state: dict) -> list[dict]:
    # самое важное сверху
    today = date.fromisoformat(state["today"])
    tasks = state["tasks"]
    out: list[dict] = []

    fog = [t for t in tasks if t["status"] == "fog"]
    for t in fog[:2]:
        out.append({
            "mood": "fog",
            "task_id": t["id"],
            "text": f"Над «{t['title']}» сгустился туман. Ничего страшного: назначь новый срок, "
                    f"и монстр вернётся на карту. Прогресс никуда не делся.",
        })

    today_info = state["days"][0]
    if today_info["rest"]:
        out.append({"mood": "rest", "text": "Сегодня привал. Отдых — тоже часть похода, силы восстанавливаются."})

    # что делать сегодня
    todo_today = [i for i in today_info["items"] if not i["done"]]
    if todo_today:
        first = todo_today[0]
        task = next(t for t in tasks if t["id"] == first["task_id"])
        dl = date.fromisoformat(task["deadline"])
        who = KINDS[task["kind"]]["name"].lower()
        extra = f" Это минут {TRAINING_MINUTES}." if first["step"].startswith("Тренировка") else ""
        out.append({
            "mood": "go",
            "task_id": task["id"],
            "step_id": first["step_id"],
            "text": f"Разведчики докладывают: {who} «{task['title']}» будет у ворот {when_text(dl, today)}. "
                    f"Начнём с удара «{first['step']}»?{extra}",
        })
        left = len(todo_today)
        if left > 1:
            out.append({"mood": "info",
                        "text": f"Всего на сегодня {left} {plural(left, 'удар', 'удара', 'ударов')}. "
                                f"По одному — и подземелье станет тише."})
    elif not today_info["rest"]:
        done_today = [i for i in today_info["items"] if i["done"]]
        if done_today:
            out.append({"mood": "win", "text": "На сегодня все удары нанесены. Отличная работа, герой! Отдыхай."})
        else:
            out.append({"mood": "calm", "text": "Сегодня монстров нет. Можно отдохнуть или заранее ударить кого-то из будущих."})

    # контрольные в ближайшие 3 дня
    for t in tasks:
        if t["kind"] not in ("boss", "guard") or t["status"] != "active":
            continue
        dl = date.fromisoformat(t["deadline"])
        delta = (dl - today).days
        if not 0 <= delta <= 3:
            continue
        weak = t["weakened"]
        if t["kind"] == "guard":
            text = (f"Сегодня испытание у стража «{t['title']}». Ты готовился, всё получится." if delta == 0 else
                    f"Страж «{t['title']}» ждёт {when_text(dl, today)}. Пара коротких тренировок, и он пропустит.")
        elif delta == 0:
            text = f"Сегодня битва с боссом «{t['title']}». Он ослаблен на {weak}%, ты готов, иди спокойно."
        else:
            text = (f"Босс «{t['title']}» ждёт в пещере {when_text(dl, today)}. Сейчас он ослаблен на {weak}%. "
                    f"Каждая тренировка снимает ему здоровье.")
        out.append({"mood": "boss", "task_id": t["id"], "text": text})

    # дни где слишком много шагов
    for d in state["days"]:
        if d["overload"]:
            dd = date.fromisoformat(d["date"])
            day_name = "сегодня" if dd == today else f"на {WEEKDAY_ACC[dd.weekday()]}"
            out.append({"mood": "warn",
                        "text": f"{day_name.capitalize()} собралось слишком много монстров. "
                                f"Может, перенести срок чего-нибудь или убрать привал?"})
            break

    if not tasks:
        out.append({"mood": "calm",
                    "text": "Подземелье пусто. Напиши, что задали, — например: «в пятницу контрольная по алгебре»."})
    return out
