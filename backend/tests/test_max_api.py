import asyncio
import json

import httpx

from bot.max_api import MaxAPI


def test_requests_match_max_docs():
    seen = []

    def handler(request: httpx.Request):
        seen.append(request)
        if request.url.path == "/updates":
            return httpx.Response(200, json={"updates": [], "marker": 42})
        return httpx.Response(200, json={"success": True})

    async def scenario():
        api = MaxAPI("secret-token", base="https://platform-api2.max.ru")
        api.client = httpx.AsyncClient(base_url="https://platform-api2.max.ru",
                                       headers={"Authorization": "secret-token"},
                                       transport=httpx.MockTransport(handler))
        data = await api.updates(None)
        await api.send(123, "Привет", [[{"type": "link", "text": "Карта", "url": "https://example.ru"}]])
        await api.answer("cb-1", "+10 опыта")
        await api.close()
        return data

    data = asyncio.run(scenario())
    assert data["marker"] == 42
    upd, msg, ans = seen
    # без Bearer
    assert all(r.headers["Authorization"] == "secret-token" for r in seen)
    assert "marker" not in upd.url.params
    assert msg.url.params["user_id"] == "123"
    body = json.loads(msg.content)
    assert body["attachments"][0]["type"] == "inline_keyboard"
    assert body["attachments"][0]["payload"]["buttons"][0][0]["url"] == "https://example.ru"
    assert ans.url.path == "/answers" and ans.url.params["callback_id"] == "cb-1"
