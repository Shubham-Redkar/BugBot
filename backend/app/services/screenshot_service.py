import os
from uuid import uuid4

from utils.constants import SCREENSHOT_DIR

os.makedirs(SCREENSHOT_DIR, exist_ok=True)


def get_screenshot_path(prefix: str, index: int) -> str:
    filename = f"{prefix}_{index}_{uuid4().hex}.png"
    return os.path.join(SCREENSHOT_DIR, filename)
