# запросы к MAX. документация: https://dev.max.ru/docs-api
import ssl
from pathlib import Path

import certifi
import httpx

from app import config


def ssl_context(certs_dir: str = config.CERTS_DIR) -> ssl.SSLContext:
    # добавляем сертификаты минцифры из папки certs
    ctx = ssl.create_default_context(cafile=certifi.where())
    for f in sorted(Path(certs_dir).glob("*")):
        if f.suffix.lower() not in {".crt", ".cer", ".pem"}:
            continue
        data = f.read_bytes()
        # файлы бывают двух форматов
        ctx.load_verify_locations(cadata=data.decode("ascii") if b"-----BEGIN" in data else data)
    return ctx


def extra_certs(certs_dir: str = config.CERTS_DIR) -> list[str]:
    return sorted(f.name for f in Path(certs_dir).glob("*") if f.suffix.lower() in {".crt", ".cer", ".pem"})


class MaxAPI:
    def __init__(self, token: str, base: str = config.MAX_API_BASE):
        self.client = httpx.AsyncClient(base_url=base, headers={"Authorization": token}, verify=ssl_context(),
                                        timeout=httpx.Timeout(100, connect=20))

    async def close(self):
        await self.client.aclose()

    async def me(self) -> dict:
        r = await self.client.get("/me")
        r.raise_for_status()
        return r.json()

    async def updates(self, marker: int | None, timeout: int = 30) -> dict:
        params = {"timeout": timeout, "limit": 100,
                  "types": "message_created,message_callback,bot_started"}
        if marker is not None:
            params["marker"] = marker
        r = await self.client.get("/updates", params=params)
        r.raise_for_status()
        return r.json()

    async def send(self, user_id: int, text: str, buttons: list[list[dict]] | None = None) -> None:
        body: dict = {"text": text[:4000]}
        if buttons:
            body["attachments"] = [{"type": "inline_keyboard", "payload": {"buttons": buttons}}]
        r = await self.client.post("/messages", params={"user_id": user_id}, json=body)
        r.raise_for_status()

    async def answer(self, callback_id: str, notification: str) -> None:
        r = await self.client.post("/answers", params={"callback_id": callback_id},
                                   json={"notification": notification})
        r.raise_for_status()
