from uuid import uuid4

from config import get_settings


def get_screenshot_path(prefix: str, index: int) -> str:
    screenshot_dir = get_settings().screenshot_dir
    screenshot_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{prefix}_{index}_{uuid4().hex}.png"
    return str(screenshot_dir / filename)
