# проверка токена: python -m bot.check
import asyncio
import ssl

import httpx

from app import config

from .max_api import MaxAPI, extra_certs


async def main() -> int:
    if not config.MAX_BOT_TOKEN:
        print("MAX_BOT_TOKEN не задан. Пропишите его в .env")
        return 1
    certs = extra_certs()
    print("Сертификаты из certs/:", ", ".join(certs) if certs else "нет")
    api = MaxAPI(config.MAX_BOT_TOKEN)
    try:
        me = await api.me()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            print("MAX ответил 401: токен неверный или отозван.")
        else:
            print(f"MAX ответил {e.response.status_code}: {e.response.text[:300]}")
        return 1
    except httpx.ConnectError as e:
        if isinstance(e.__cause__, ssl.SSLCertVerificationError) or "CERTIFICATE_VERIFY_FAILED" in str(e):
            print("Нет доверия к сертификату MAX. Положите корневой и выпускающий сертификаты Минцифры "
                  "в папку backend/certs (скачать: https://www.gosuslugi.ru/crt) и пересоберите контейнер.")
        else:
            print(f"Не удалось подключиться к MAX: {e}")
        return 1
    except httpx.TimeoutException:
        print("MAX не отвечает. Проверьте сеть: VPN, прокси, антивирус с проверкой HTTPS.")
        return 1
    finally:
        await api.close()
    print(f"Токен рабочий. Бот: {me.get('first_name')} (@{me.get('username')}), id {me.get('user_id')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
