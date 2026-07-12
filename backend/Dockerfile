FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

WORKDIR /app

COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --requirement requirements.txt \
    && python -m playwright install --with-deps chromium \
    && useradd --create-home --uid 10001 --shell /usr/sbin/nologin bugbot \
    && mkdir -p /app/app/screenshots \
    && chown -R bugbot:bugbot /app /ms-playwright

COPY --chown=bugbot:bugbot alembic.ini ./alembic.ini
COPY --chown=bugbot:bugbot alembic ./alembic
COPY --chown=bugbot:bugbot app ./app

USER bugbot
WORKDIR /app/app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/', timeout=3)"]

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
