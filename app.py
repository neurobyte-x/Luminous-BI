from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
import sys


BACKEND_DIR = Path(__file__).resolve().parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

spec = spec_from_file_location("backend_entry_app", BACKEND_DIR / "app.py")
if spec is None or spec.loader is None:
    raise RuntimeError("Unable to load backend app module.")

backend_module = module_from_spec(spec)
spec.loader.exec_module(backend_module)
app = backend_module.app
