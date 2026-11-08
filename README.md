# Данж недели

Игра для школьников. Учебная неделя - это поход по тропе, задания - монстры, контрольные - боссы.
Пишешь, что задали, а игра сама делит задание на маленькие шаги и раскладывает их по дням.

Команда «Айтувал» из учеников 8 класса, хакатон «Идея Фикс», направление «Подземелье знаний».
Наставник: Рафальский Константин Евгеньевич, педагог Мобильного Кванториума 28.

## Монстры

| Монстр | Что это |
|---|---|
| Слизень | мелочь: сдать тетрадь, проверка домашки |
| Гоблин | обычная домашка |
| Тролль | доклад, проект, сочинение |
| Страж | тест, пересказ, стих |
| Босс | контрольная, проверочная, диктант, пробник |

## Как запустить

### Через Docker

Нужен Docker Desktop. В папке проекта:

```
docker compose up -d --build
```

Сайт откроется тут: http://localhost:8000

Чтобы сразу был герой с заполненной неделей:

```
docker compose exec web python -m app.demo
```

Команда напишет ссылку для входа.

### Без Docker

Нужен Python 3.12.

```
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Бот в MAX

1. Скопировать `.env.example` в `.env`.
2. Вписать токен в `.env` (`MAX_BOT_TOKEN=`).
3. Сертификаты Минцифры положить их в `backend/certs`.
4. Запустить: `docker compose --profile bot up -d --build`
5. Проверить токен: `docker compose exec web python -m bot.check`
6. На сайте открыть профиль, раздел «Бот в MAX», и отправить боту код.

## Что где лежит

- `frontend` - сайт (HTML, CSS, JavaScript)
- `backend/app` - сервер на Python (FastAPI) и база SQLite
- `backend/bot` - бот для MAX
- `backend/tests` - тесты, запуск: `pip install -r requirements-dev.txt`, потом `pytest`

## Полезное

- Любое время года: http://localhost:8000/?season=winter (ещё spring, summer, autumn, newyear)
- Все картинки игры: http://localhost:8000/sprites.html
- Настройки лежат в `.env`, пример в `.env.example`
