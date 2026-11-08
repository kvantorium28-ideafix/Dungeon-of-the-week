# что бот отвечает. тут нет интернета, поэтому можно тестировать
import re
from datetime import date, datetime

from app import config, guide, parser, services
from app.game import KINDS

HELP = (
    "Я картограф подземелья «Данж недели».\n\n"
    "Просто напиши, что задали, — например:\n"
    "«в пятницу контрольная по алгебре, а в среду доклад по истории»\n\n"
    "Команды:\n"
    "/today — что сегодня в подземелье\n"
    "/map — открыть карту недели\n"
    "/help — эта подсказка"
)
NOT_LINKED = (
    "Я пока не знаю, чей ты герой. Открой веб-приложение «Данж недели», "
    "нажми на своего героя → «Бот в MAX» и пришли мне код из шести символов."
)
CODE_RE = re.compile(r"^(?:/start\s+)?([A-Za-z0-9]{6})$")


def send(user_id: int, text: str, buttons: list[list[dict]] | None = None) -> dict:
    return {"type": "send", "user_id": user_id, "text": text, "buttons": buttons or []}


def map_button(hero) -> dict:
    return {"type": "link", "text": "Открыть карту недели", "url": f"{config.PUBLIC_URL}/?hero={hero['token']}"}


def fmt_day(iso: str) -> str:
    d = date.fromisoformat(iso)
    return f"{guide.WEEKDAY_SHORT[d.weekday()].lower()}, {d.day} {services.MONTHS_SHORT[d.month - 1]}"


def digest(conn, hero, force: bool = False) -> dict | None:
    # план на сегодня
    st = services.state(conn, hero)
    today = st["days"][0]
    todo = [i for i in today["items"] if not i["done"]]
    lines: list[str] = []
    if today["rest"]:
        lines.append("Сегодня привал — отдыхай, силы восстанавливаются.")
    if todo:
        lines.append("Сегодня в подземелье:")
        for it in todo:
            mark = "!" if it["is_battle"] else "-"
            lines.append(f"{mark} {it['title']} — {it['step']}")
    for m in st["guide"]:
        if m["mood"] in ("boss", "fog", "warn"):
            lines.append("")
            lines.append(m["text"])
    if not lines:
        if not force:
            return None
        lines.append("Сегодня монстров нет. Можно отдохнуть или написать мне, что задали.")

    buttons = []
    first = next((i for i in todo if not i["is_battle"]), None)
    if first:
        buttons.append([{"type": "callback", "text": f"Ударить: {first['step']}"[:64], "payload": f"hit:{first['step_id']}"}])
    buttons.append([map_button(hero)])
    return send(hero["max_user_id"], "\n".join(lines), buttons)


def handle_update(conn, update: dict) -> list[dict]:
    kind = update.get("update_type")
    if kind == "bot_started":
        user_id = update["user"]["user_id"]
        payload = (update.get("payload") or "").strip()
        if payload:
            return _link(conn, user_id, payload)
        hero = services.hero_by_max_user(conn, user_id)
        return [send(user_id, HELP if hero else NOT_LINKED)]

    if kind == "message_created":
        msg = update.get("message") or {}
        sender = msg.get("sender") or {}
        user_id = sender.get("user_id")
        text = ((msg.get("body") or {}).get("text") or "").strip()
        if not user_id or not text or sender.get("is_bot"):
            return []
        return _on_text(conn, user_id, text)

    if kind == "message_callback":
        cb = update.get("callback") or {}
        return _on_button(conn, cb)

    return []


def _link(conn, user_id: int, code: str) -> list[dict]:
    hero = services.link_max_user(conn, code, user_id)
    if not hero:
        return [send(user_id, "Такого кода нет. Проверь его в веб-приложении: герой → «Бот в MAX».")]
    out = [send(user_id, f"Готово, {hero['name']}! Теперь я буду напоминать о монстрах "
                         f"(но не после {config.QUIET_FROM}:00 — сон тоже часть подготовки).\n\n" + HELP,
                [[map_button(hero)]])]
    d = digest(conn, hero)
    if d:
        out.append(d)
    return out


def _on_text(conn, user_id: int, text: str) -> list[dict]:
    m = CODE_RE.match(text)
    hero = services.hero_by_max_user(conn, user_id)
    if m and (not hero or text.startswith("/start")):
        return _link(conn, user_id, m.group(1))
    if text.startswith("/start"):
        return [send(user_id, HELP if hero else NOT_LINKED)]
    if not hero:
        return [send(user_id, NOT_LINKED)]

    low = text.lower()
    if low in ("/help", "помощь", "help"):
        return [send(user_id, HELP)]
    if low in ("/today", "сегодня", "план", "что сегодня"):
        return [digest(conn, hero, force=True)]
    if low in ("/map", "карта"):
        return [send(user_id, "Вот твоя карта недели:", [[map_button(hero)]])]

    drafts = parser.parse(text, services.today())
    if not drafts:
        return [send(user_id, "Не нашёл в сообщении заданий. Напиши, что задали и когда, например: "
                              "«завтра выучить слова по английскому».")]
    lines = ["Записал в подземелье:"]
    guessed = False
    for d in drafts:
        services.create_task(conn, hero["id"], d["title"], d["kind"], d["subject"],
                             date.fromisoformat(d["deadline"]))
        lines.append(f"- {KINDS[d['kind']]['name']} «{d['title']}», до {fmt_day(d['deadline'])}")
        guessed = guessed or d["date_guessed"]
    if guessed:
        lines.append("\nСрок я не услышал и поставил примерный — поправь его на карте, если нужно.")
    if any(d["kind"] in ("troll", "guard", "boss") for d in drafts):
        lines.append("\nБольшие задания я разбил на удары и разложил по дням.")
    return [send(user_id, "\n".join(lines), [[map_button(hero)]])]


def _on_button(conn, cb: dict) -> list[dict]:
    user_id = (cb.get("user") or {}).get("user_id")
    callback_id = cb.get("callback_id")
    payload = cb.get("payload") or ""
    hero = services.hero_by_max_user(conn, user_id) if user_id else None
    if not hero:
        return [{"type": "answer", "callback_id": callback_id, "notification": "Сначала привяжи героя кодом"}]
    if payload.startswith("hit:"):
        try:
            result = services.hit_step(conn, hero["id"], int(payload[4:]))
        except (services.NotFound, ValueError):
            return [{"type": "answer", "callback_id": callback_id, "notification": "Этот удар уже не найден"}]
        note = f"+{result['xp']} опыта" if result["xp"] else "Этот удар уже нанесён"
        if result.get("victory"):
            note = f"Победа! +{result['xp']} опыта"
        out = [{"type": "answer", "callback_id": callback_id, "notification": note}]
        d = digest(conn, hero, force=True)
        out.append(d)
        return out
    return [{"type": "answer", "callback_id": callback_id, "notification": "Не понял кнопку"}]


def is_quiet(now: datetime) -> bool:
    h = now.hour
    if config.QUIET_FROM > config.QUIET_TO:
        return h >= config.QUIET_FROM or h < config.QUIET_TO
    return config.QUIET_FROM <= h < config.QUIET_TO


def _mark_once(conn, hero_id: int, key: str) -> bool:
    # чтобы не слать одно и то же два раза
    cur = conn.execute("INSERT OR IGNORE INTO sent_reminders (hero_id, key) VALUES (?, ?)", (hero_id, key))
    return cur.rowcount == 1


def due_reminders(conn, now: datetime) -> list[dict]:
    # не больше двух сообщений в день
    if is_quiet(now):
        return []
    out = []
    today = now.date().isoformat()
    heroes = conn.execute("SELECT * FROM heroes WHERE max_user_id IS NOT NULL").fetchall()
    for hero in heroes:
        # утром в день контрольной
        bosses = conn.execute(
            "SELECT * FROM tasks WHERE hero_id = ? AND kind = 'boss' AND deadline = ? AND done_at IS NULL",
            (hero["id"], today),
        ).fetchall()
        for b in bosses:
            if _mark_once(conn, hero["id"], f"boss-day:{b['id']}"):
                st = services.state(conn, hero)
                weak = next((t["weakened"] for t in st["tasks"] if t["id"] == b["id"]), 0)
                out.append(send(hero["max_user_id"],
                                f"Сегодня битва с боссом «{b['title']}». Он ослаблен на {weak}%. "
                                f"Ты готовился — иди спокойно. Удачи!"))
        # план на день, в воскресенье ещё итоги недели
        if now.hour >= config.DIGEST_HOUR:
            d = digest(conn, hero)
            if now.weekday() == 6:
                week = week_text(services.week_summary(conn, hero["id"], now.date()))
                if d:
                    d["text"] = week + "\n\n" + d["text"]
                else:
                    d = send(hero["max_user_id"], week, [[map_button(hero)]])
            if d and _mark_once(conn, hero["id"], f"digest:{today}"):
                out.append(d)
    return out


def week_text(w: dict) -> str:
    if not w["steps"]:
        return "Итоги недели: в этот раз без ударов. Новая неделя — новый поход, начнём с малого."
    names = {"slime": "слизней", "goblin": "гоблинов", "troll": "троллей", "guard": "стражей", "boss": "боссов"}
    lines = [f"Итоги недели: {w['steps']} {guide.plural(w['steps'], 'удар', 'удара', 'ударов')}, +{w['xp']} опыта."]
    beaten = [f"{names[k]}: {n}" for k, n in w["defeated"].items() if n]
    if beaten:
        lines.append("Побеждено " + ", ".join(beaten) + ".")
    for b in w["bosses"]:
        lines.append(f"Босс «{b['title']}» ослаблен на {b['weakened']}%." if not b["done"]
                     else f"Босс «{b['title']}» повержен.")
    return "\n".join(lines)
