# сервер сайта. запуск: uvicorn app.main:app --reload
import os
from contextlib import asynccontextmanager
from datetime import date
from pathlib import Path

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from . import db, parser, services

FRONTEND_DIR = Path(os.getenv("FRONTEND_DIR", Path(__file__).resolve().parents[2] / "frontend"))


@asynccontextmanager
async def lifespan(_app):
    db.init_db()  # создаём таблицы если их нет
    yield


app = FastAPI(title="Данж недели", version="1.0", lifespan=lifespan)


@app.middleware("http")
async def no_stale_static(request, call_next):
    # чтобы браузер не показывал старые файлы
    response = await call_next(request)
    if not request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-cache"
    return response


@app.exception_handler(services.NotFound)
def not_found(_, exc):
    return JSONResponse(status_code=404, content={"detail": f"Не найдено: {exc}"})


@app.exception_handler(ValueError)
def bad_value(_, exc):
    return JSONResponse(status_code=400, content={"detail": str(exc)})


class NewHero(BaseModel):
    name: str = Field(min_length=1, max_length=40)
    gender: str = "m"


class HeroPatch(BaseModel):
    name: str | None = None
    skin: str | None = None
    pet: str | None = None
    gender: str | None = None
    weapon: str | None = None


class ParseIn(BaseModel):
    text: str = Field(min_length=1, max_length=500)


class TaskIn(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    kind: str
    subject: str = ""
    deadline: date


class TaskBatch(BaseModel):
    tasks: list[TaskIn]


class TaskPatch(BaseModel):
    title: str | None = None
    deadline: date | None = None
    kind: str | None = None
    subject: str | None = None


def current_hero(x_hero_token: str = Header(default="")):
    if not x_hero_token:
        raise HTTPException(401, "Нужен заголовок X-Hero-Token")
    with db.session() as conn:
        try:
            return services.hero_by_token(conn, x_hero_token)
        except services.NotFound:
            raise HTTPException(401, "Герой не найден — войдите заново")


def _state(hero):
    with db.session() as conn:
        return services.state(conn, hero)


@app.get("/api/health")
def health():
    return {"ok": True}


@app.post("/api/heroes")
def new_hero(body: NewHero):
    with db.session() as conn:
        hero = services.create_hero(conn, body.name, body.gender)
        token = hero["token"]
    return {"token": token, "state": _state(hero)}


@app.get("/api/state")
def get_state(hero=Depends(current_hero)):
    return _state(hero)


@app.patch("/api/hero")
def patch_hero(body: HeroPatch, hero=Depends(current_hero)):
    with db.session() as conn:
        services.update_hero(conn, hero, name=body.name, skin=body.skin, pet=body.pet,
                             gender=body.gender, weapon=body.weapon)
    return _state(hero)


@app.post("/api/parse")
def parse_phrase(body: ParseIn, hero=Depends(current_hero)):
    return {"drafts": parser.parse(body.text, services.today())}


@app.post("/api/tasks")
def add_tasks(body: TaskBatch, hero=Depends(current_hero)):
    with db.session() as conn:
        for t in body.tasks:
            services.create_task(conn, hero["id"], t.title, t.kind, t.subject, t.deadline)
    return _state(hero)


@app.patch("/api/tasks/{task_id}")
def patch_task(task_id: int, body: TaskPatch, hero=Depends(current_hero)):
    with db.session() as conn:
        services.update_task(conn, hero["id"], task_id, title=body.title, deadline=body.deadline,
                             kind=body.kind, subject=body.subject)
    return _state(hero)


@app.delete("/api/tasks/{task_id}")
def remove_task(task_id: int, hero=Depends(current_hero)):
    with db.session() as conn:
        services.delete_task(conn, hero["id"], task_id)
    return _state(hero)


@app.post("/api/steps/{step_id}/hit")
def hit(step_id: int, hero=Depends(current_hero)):
    with db.session() as conn:
        result = services.hit_step(conn, hero["id"], step_id)
    return {"result": result, "state": _state(hero)}


@app.post("/api/steps/{step_id}/undo")
def undo(step_id: int, hero=Depends(current_hero)):
    with db.session() as conn:
        services.undo_step(conn, hero["id"], step_id)
    return _state(hero)


@app.post("/api/rest/{day}")
def rest(day: date, hero=Depends(current_hero)):
    with db.session() as conn:
        services.toggle_rest(conn, hero["id"], day)
    return _state(hero)


# это должно быть в конце, а то сломается /api
if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
