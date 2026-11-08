# настройки берём из .env
import os
from zoneinfo import ZoneInfo

DB_PATH = os.getenv("DB_PATH", "data/danzh.db")

# время Благовещенска
TZ = ZoneInfo(os.getenv("TZ_NAME", "Asia/Yakutsk"))

# адрес сайта (для ссылок в боте)
PUBLIC_URL = os.getenv("PUBLIC_URL", "http://localhost:8000").rstrip("/")

# сколько шагов в день можно
STAMINA_PER_DAY = int(os.getenv("STAMINA_PER_DAY", "4"))

MAX_BOT_TOKEN = os.getenv("MAX_BOT_TOKEN", "")
MAX_API_BASE = os.getenv("MAX_API_BASE", "https://platform-api2.max.ru").rstrip("/")
# папка с сертификатами минцифры (без них MAX не работает)
CERTS_DIR = os.getenv("CERTS_DIR", os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "certs"))

# ночью бот не пишет
QUIET_FROM = int(os.getenv("QUIET_FROM", "21"))
QUIET_TO = int(os.getenv("QUIET_TO", "8"))

# во сколько бот шлёт план на день
DIGEST_HOUR = int(os.getenv("DIGEST_HOUR", "15"))
