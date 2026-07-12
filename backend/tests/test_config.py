import pytest
from pydantic import ValidationError

from config import BACKEND_DIR, Settings


def test_settings_have_safe_development_defaults():
    settings = Settings(_env_file=None)

    assert settings.max_pages == 5
    assert settings.headless is True
    assert settings.llm_concurrency == 3
    assert settings.cors_origins == ["http://localhost:5173"]
    assert settings.screenshot_dir.is_absolute()


def test_settings_read_and_coerce_environment(monkeypatch):
    monkeypatch.setenv("MAX_PAGES", "12")
    monkeypatch.setenv("HEADLESS", "false")
    monkeypatch.setenv("CORS_ORIGINS", '["https://app.example.com"]')
    monkeypatch.setenv("SCREENSHOT_DIR", "var/screenshots")

    settings = Settings(_env_file=None)

    assert settings.max_pages == 12
    assert settings.headless is False
    assert settings.cors_origins == ["https://app.example.com"]
    assert settings.screenshot_dir == (BACKEND_DIR / "var/screenshots").resolve()


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("max_pages", 0),
        ("llm_concurrency", 0),
        ("llm_timeout_seconds", 0),
        ("scan_timeout_seconds", -1),
    ],
)
def test_settings_reject_invalid_positive_limits(field, value):
    with pytest.raises(ValidationError):
        Settings(_env_file=None, **{field: value})


def test_settings_reject_wildcard_cors_with_credentials():
    with pytest.raises(ValidationError):
        Settings(_env_file=None, cors_origins=["*"])


def test_settings_require_async_postgres_driver():
    with pytest.raises(ValidationError):
        Settings(_env_file=None, database_url="postgresql://localhost/bugbot")


def test_secret_is_masked_in_settings_representation():
    settings = Settings(_env_file=None, groq_api_key="super-secret")

    assert "super-secret" not in repr(settings)


def test_settings_require_redis_celery_broker():
    with pytest.raises(ValidationError):
        Settings(_env_file=None, celery_broker_url="amqp://localhost")


def test_settings_require_ordered_celery_time_limits():
    with pytest.raises(ValidationError):
        Settings(
            _env_file=None,
            celery_task_soft_time_limit_seconds=600,
            celery_task_time_limit_seconds=600,
        )
