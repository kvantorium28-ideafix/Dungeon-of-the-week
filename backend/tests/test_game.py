from app import game


def names(steps):
    return [s for s, _ in steps]


def test_boss_steps_depend_on_subject_and_type():
    math = game.steps_for("boss", "Контрольная по алгебре", "Алгебра", 4)
    assert "формул" in names(math)[0]
    assert math[-1] == ("Битва: контрольная", True)
    dictation = game.steps_for("boss", "Словарный диктант", "Русский язык", 2)
    assert len(dictation) == 3 and dictation[-1] == ("Битва: диктант", True)
    exam = game.steps_for("boss", "Пробник ОГЭ", "Математика", 4)
    assert exam[-1][0] == "Битва: пробный экзамен"


def test_guard_has_trainings_and_trial():
    test = game.steps_for("guard", "Тест по истории", "История")
    assert test[-1] == ("Испытание: тест", True)
    assert all(s.startswith("Тренировка") for s, b in test if not b)
    poem = game.steps_for("guard", "Выучить стих", "Литература")
    assert "наизусть" in poem[-1][0] or "стих" in poem[-1][0]


def test_goblin_steps_by_subject():
    assert names(game.steps_for("goblin", "Упражнение 112", "Русский язык")) == ["Повторить правило", "Выполнить упражнение"]
    assert names(game.steps_for("goblin", "Лабораторная работа", "Физика"))[1] == "Оформить лабораторную"


def test_skill_levels():
    assert game.skill_level(0) == 1
    assert game.skill_level(100) == 3
    assert game.skill_level(1080) == 10
    assert game.skill_info("math", 1200)["to_next"] is None
    assert game.skill_info("math", 1200)["rank"] == "Легенда"


def test_weapon_tiers():
    by_id = lambda xp, lvl: {w["id"]: w for w in game.weapons_unlocked(xp, lvl)}
    w = by_id({}, 1)
    assert w["sword"]["tier"] == 1 and w["sword"]["name"] == "Меч новичка"
    assert not w["ruler"]["unlocked"] and w["ruler"]["need"] == "Математика: 3 уровень"
    w = by_id({"math": 100}, 1)
    assert w["ruler"]["tier"] == 1 and w["ruler"]["next"] == {"level": 6, "name": "Клинок теоремы"}
    w = by_id({"math": 400}, 6)
    assert w["ruler"]["name"] == "Клинок теоремы" and w["sword"]["name"] == "Закалённый меч"
    w = by_id({"math": 1080}, 10)
    assert w["ruler"]["tier"] == 3 and w["ruler"]["next"] is None and w["sword"]["tier"] == 3
