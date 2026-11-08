import os
import sys
import tempfile
from pathlib import Path

# отдельная база для тестов
os.environ["DB_PATH"] = str(Path(tempfile.mkdtemp()) / "test.db")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
