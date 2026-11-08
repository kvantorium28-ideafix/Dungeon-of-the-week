import asyncio

import httpx

from bot.run import perform


class FakeAPI:
    def __init__(self):
        self.sent = []

    async def send(self, user_id, text, buttons=None):
        if any(b["type"] == "link" for row in buttons or [] for b in row):
            req = httpx.Request("POST", "https://x/messages")
            raise httpx.HTTPStatusError("400", request=req, response=httpx.Response(400, request=req, text="bad url"))
        self.sent.append((user_id, text, buttons))


def test_link_buttons_fall_back_to_text():
    api = FakeAPI()
    action = {"type": "send", "user_id": 1, "text": "Карта:",
              "buttons": [[{"type": "callback", "text": "Ударить", "payload": "hit:1"}],
                          [{"type": "link", "text": "Открыть карту", "url": "http://localhost:8000/?hero=t"}]]}
    asyncio.run(perform(api, [action]))
    (uid, text, buttons), = api.sent
    assert "http://localhost:8000/?hero=t" in text
    assert buttons == [[{"type": "callback", "text": "Ударить", "payload": "hit:1"}]]
