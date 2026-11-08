# запуск бота: python -m bot.run
import asyncio
import logging

import httpx

from app import config, db, services

from . import logic
from .max_api import MaxAPI

log = logging.getLogger("bot")
REMINDER_EVERY = 300  # секунд


async def perform(api: MaxAPI, actions: list[dict]) -> None:
    for a in actions:
        if not a:
            continue
        try:
            if a["type"] == "send":
                await send_safe(api, a)
            elif a["type"] == "answer":
                await api.answer(a["callback_id"], a["notification"])
        except httpx.HTTPStatusError as e:
            log.warning("Не удалось выполнить %s: %s %s", a["type"], e.response.status_code, e.response.text[:500])
        except httpx.HTTPError as e:
            log.warning("Не удалось выполнить %s: %s", a["type"], e)
        await asyncio.sleep(0.6)  # MAX не даёт слать слишком часто


async def send_safe(api: MaxAPI, a: dict) -> None:
    # MAX не берёт кнопки со ссылкой на localhost, тогда пишем ссылку текстом
    try:
        await api.send(a["user_id"], a["text"], a["buttons"])
    except httpx.HTTPStatusError as e:
        links = [b for row in a["buttons"] for b in row if b.get("type") == "link"]
        if e.response.status_code != 400 or not links:
            raise
        log.warning("MAX не принял кнопки (%s), отправляю без ссылок", e.response.text[:300])
        rows = [[b for b in row if b.get("type") != "link"] for row in a["buttons"]]
        text = a["text"] + "".join(f"\n\n{b['text']}: {b['url']}" for b in links)
        await api.send(a["user_id"], text, [r for r in rows if r])


async def poll(api: MaxAPI) -> None:
    marker = None
    while True:
        try:
            data = await api.updates(marker)
        except httpx.HTTPError as e:
            log.warning("Ошибка получения обновлений: %s — повтор через 5 с", e)
            await asyncio.sleep(5)
            continue
        marker = data.get("marker", marker)
        for upd in data.get("updates", []):
            try:
                with db.session() as conn:
                    actions = logic.handle_update(conn, upd)
            except Exception:  # чтобы бот не падал
                log.exception("Ошибка обработки события %s", upd.get("update_type"))
                continue
            await perform(api, actions)


async def remind(api: MaxAPI) -> None:
    while True:
        try:
            with db.session() as conn:
                actions = logic.due_reminders(conn, services.now())
            await perform(api, actions)
        except Exception:
            log.exception("Ошибка рассылки напоминаний")
        await asyncio.sleep(REMINDER_EVERY)


async def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
    if not config.MAX_BOT_TOKEN:
        log.error("Не задан MAX_BOT_TOKEN. Получите токен на business.max.ru → Чат-боты и пропишите его в .env")
        return
    db.init_db()
    api = MaxAPI(config.MAX_BOT_TOKEN)
    me = await api.me()
    log.info("Бот запущен: %s", me.get("first_name") or me.get("username") or me.get("user_id"))
    try:
        await asyncio.gather(poll(api), remind(api))
    finally:
        await api.close()


if __name__ == "__main__":
    asyncio.run(main())
