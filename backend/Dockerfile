FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*

RUN pip install uv --quiet

COPY pyproject.toml uv.lock ./
COPY src/ ./src/
COPY data/ ./data/

RUN uv sync --frozen

EXPOSE 8000

CMD ["uv", "run", "--", "uvicorn", "license_policy.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
