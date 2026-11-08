# тестовый герой Маша с готовой неделей. запуск: python -m app.demo
from datetime import timedelta

from . import config, db, parser, services


def main() -> None:
    db.init_db()
    today = services.today()
    with db.session() as conn:
        hero = services.create_hero(conn, "Маша", gender="f")
        phrase = ("через 5 дней контрольная по алгебре, а через 3 дня сдать доклад по истории, "
                  "завтра выучить 10 слов по английскому, послезавтра номера 5-7 по геометрии, "
                  "через 4 дня тест по биологии, через 9 дней проект по информатике")
        drafts = parser.parse(phrase, today)
        # привал в выходной
        deadlines = {d["deadline"] for d in drafts}
        days = [today + timedelta(days=i) for i in range(2, 7)]
        rest = next((d for d in days if d.weekday() >= 5 and d.isoformat() not in deadlines), days[-1])
        services.toggle_rest(conn, hero["id"], rest)
        for d in drafts:
            services.create_task(conn, hero["id"], d["title"], d["kind"], d["subject"],
                                 today.fromisoformat(d["deadline"]))
        # просроченное задание, чтобы был туман
        services.create_task(conn, hero["id"], "Упражнение 112", "goblin", "Русский язык",
                             today - timedelta(days=1))

        # пара ударов
        state = services.state(conn, hero)
        troll = next(t for t in state["tasks"] if t["kind"] == "troll" and "истори" in t["title"].lower())
        services.hit_step(conn, hero["id"], troll["steps"][0]["id"])
        boss = next(t for t in state["tasks"] if t["kind"] == "boss")
        services.hit_step(conn, hero["id"], boss["steps"][0]["id"])
        slime = next(t for t in state["tasks"] if t["kind"] == "slime")
        services.hit_step(conn, hero["id"], slime["steps"][0]["id"])

    print("Демо-герой готов. Откройте ссылку:")
    print(f"{config.PUBLIC_URL}/?hero={hero['token']}")
    print(f"Код для привязки бота MAX: {hero['link_code']}")


if __name__ == "__main__":
    main()
