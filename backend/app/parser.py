# разбираем фразу ученика на задания. ищем по ключевым словам
import re
from datetime import date, timedelta

# сверху самое важное, порядок не менять!
KIND_WORDS = [
    ("boss",   ["контрольн", "проверочн", "диктант", "экзамен", "огэ", "егэ", "впр", "пробник",
                r"пробн\w+ (?:экзамен|вариант|огэ|егэ)", "итогов", "зачет", r"\bкр\b"]),
    ("guard",  ["тест", "пересказ", "наизусть", "стих", "опрос", "самостоятельн", "изложени",
                "у доски"]),
    ("troll",  ["доклад", "проект", "реферат", "сочинени", "эссе", "презентац", "исследовани"]),
    ("slime",  ["тетрад", "проверк", "подпис", "принест", "форм", "слова", "правило", "повторить",
                "выучить"]),
    ("goblin", ["домашк", r"\bдз\b", "д/з", "задач", "упражнени", "номер", "№", "лабораторн",
                "практическ", "конспект", "решить", "сделать", "прочитать", "прочесть", "параграф",
                r"\bглав"]),
]

SUBJECTS = [
    ("алгебр", "Алгебра"), ("геометр", "Геометрия"), ("математ", "Математика"),
    ("физкульт", "Физкультура"), (r"\bфизр", "Физкультура"), ("физик", "Физика"),
    ("хими", "Химия"), ("биолог", "Биология"), ("истори", "История"),
    ("обществ", "Обществознание"), ("литератур", "Литература"), ("русск", "Русский язык"),
    ("английск", "Английский язык"), (r"\bангл", "Английский язык"), ("немецк", "Немецкий язык"),
    ("француз", "Французский язык"), ("информатик", "Информатика"), ("географ", "География"),
    ("музык", "Музыка"), (r"\bизо\b", "ИЗО"), (r"\bобж\b", "ОБЖ"), ("технолог", "Технология"),
    ("астроном", "Астрономия"), ("окружающ", "Окружающий мир"),
]

WEEKDAYS = [  # пн = 0
    r"понедельник\w*", r"вторник\w*", r"сред[аеуы]", r"четверг\w*",
    r"пятниц[аеуы]", r"суббот[аеуы]", r"воскресень[еяю]",
]
MONTHS = ["январ", "феврал", "март", "апрел", "ма[яй]", "июн", "июл", "август",
          "сентябр", "октябр", "ноябр", "декабр"]

PREP = r"(?:(?:в|во|к|ко|до|на|в\s+эт[оиу]\w*|к\s+эт\w*)\s+)?"
NEXT = r"(?:следующ\w*\s+)"

# если дату не сказали, ставим через столько дней
DEFAULT_DAYS = {"slime": 1, "goblin": 1, "troll": 7, "guard": 3, "boss": 7}


def _norm(text: str) -> str:
    return text.lower().replace("ё", "е")


def find_kind(text: str) -> str | None:
    low = _norm(text)
    for kind, words in KIND_WORDS:
        for w in words:
            if re.search(w, low):
                return kind
    return None


# предмет по слову, если его не написали
SUBJECT_HINTS = [("диктант", "Русский язык"), ("изложени", "Русский язык"), ("стих", "Литература"),
                 ("сочинени", "Литература"), ("пересказ", "Литература")]


def find_subject(text: str) -> str:
    low = _norm(text)
    for stem, name in SUBJECTS:
        if re.search(stem, low):
            return name
    for stem, name in SUBJECT_HINTS:
        if stem in low:
            return name
    return ""


def find_date(text: str, today: date) -> tuple[date | None, tuple[int, int] | None]:
    # ищем дату в тексте
    low = _norm(text)

    m = re.search(PREP + r"послезавтра", low)
    if m:
        return today + timedelta(days=2), m.span()
    m = re.search(PREP + r"завтра", low)
    if m:
        return today + timedelta(days=1), m.span()
    m = re.search(PREP + r"сегодня", low)
    if m:
        return today, m.span()

    m = re.search(r"через\s+(\d+)\s+(?:дн|ден)\w*", low)
    if m:
        return today + timedelta(days=int(m.group(1))), m.span()
    m = re.search(r"через\s+неделю", low)
    if m:
        return today + timedelta(days=7), m.span()

    # 25.10 или 25.10.2026
    m = re.search(PREP + r"(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?", low)
    if m:
        d = _make_date(today, int(m.group(1)), int(m.group(2)), m.group(3))
        if d:
            return d, m.span()

    # 25 октября
    for i, month in enumerate(MONTHS):
        m = re.search(PREP + r"(\d{1,2})\s+" + month + r"\w*", low)
        if m:
            d = _make_date(today, int(m.group(1)), i + 1, None)
            if d:
                return d, m.span()

    # «в пятницу», «в следующую пятницу»
    for wd, pattern in enumerate(WEEKDAYS):
        m = re.search(PREP + "(" + NEXT + ")?" + r"\b" + pattern, low)
        if m:
            ahead = (wd - today.weekday()) % 7
            if ahead == 0:
                ahead = 7  # если сегодня среда, то «в среду» это через неделю
            d = today + timedelta(days=ahead)
            if m.group(1):  # «в следующую пятницу»
                monday_next = today + timedelta(days=7 - today.weekday())
                d = monday_next + timedelta(days=wd)
            return d, m.span()

    return None, None


def _make_date(today: date, day: int, month: int, year: str | None) -> date | None:
    try:
        if year:
            y = int(year)
            if y < 100:
                y += 2000
            return date(y, month, day)
        d = date(today.year, month, day)
        if d < today:
            d = date(today.year + 1, month, day)
        return d
    except ValueError:
        return None


FILLER = re.compile(
    r"^(?:а|и|ещ[её]|еще|также|нужно|надо|нам|у\s+нас|будет|задали|по\s+плану)\s+", re.IGNORECASE
)


def _make_title(clause: str, span: tuple[int, int] | None, kind: str, subject: str) -> str:
    text = clause
    if span:
        text = text[: span[0]] + " " + text[span[1]:]
    text = re.sub(r"\s+", " ", text).strip(" ,.;:-—")
    prev = None
    while prev != text:  # убираем «а», «ещё», «нужно» в начале
        prev = text
        text = FILLER.sub("", text).strip()
    if not text:
        from .game import KINDS
        text = KINDS[kind]["name"] + (f" — {subject}" if subject else "")
    return text[0].upper() + text[1:]


def split_clauses(phrase: str) -> list[str]:
    # режем фразу по запятым и "а". кусок без задания приклеиваем к прошлому
    raw = re.split(r"[,;\n]+|\s+а\s+", phrase)
    parts: list[str] = []
    for piece in raw:
        piece = piece.strip()
        if not piece:
            continue
        # «доклад и контрольная» это два задания
        sub = re.split(r"\s+и\s+", piece)
        if len(sub) > 1 and all(find_kind(s) for s in sub):
            parts.extend(sub)
        else:
            parts.append(piece)

    merged: list[str] = []
    for piece in parts:
        if merged and not find_kind(piece):
            merged[-1] = merged[-1] + ", " + piece
        else:
            merged.append(piece)
    return merged


def parse(phrase: str, today: date) -> list[dict]:
    result = []
    for clause in split_clauses(phrase):
        kind = find_kind(clause)
        subject = find_subject(clause)
        if not kind and not subject:
            continue
        kind = kind or "goblin"
        when, span = find_date(clause, today)
        guessed = when is None
        if when is None:
            when = today + timedelta(days=DEFAULT_DAYS[kind])
        result.append({
            "title": _make_title(clause, span, kind, subject),
            "kind": kind,
            "subject": subject,
            "deadline": when.isoformat(),
            "date_guessed": guessed,
        })

    # дата в конце подходит для всех заданий
    for i, r in enumerate(result):
        if r["date_guessed"]:
            later = [x for x in result[i + 1:] if not x["date_guessed"]]
            if later:
                r["deadline"] = later[0]["deadline"]
                r["date_guessed"] = False
    return result
