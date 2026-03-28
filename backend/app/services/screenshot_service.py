import os
from datetime import datetime
from utils.constants import SCREENSHOT_DIR

os.makedirs(SCREENSHOT_DIR, exist_ok=True)


def get_screenshot_path(prefix: str, index: int) -> str:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{prefix}_{index}_{timestamp}.png"
    return os.path.join(SCREENSHOT_DIR, filename)
