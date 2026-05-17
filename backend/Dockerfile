FROM python:3.11-slim

WORKDIR /app

RUN pip install uv --quiet

COPY pyproject.toml uv.lock ./
COPY src/ ./src/
COPY data/ ./data/

RUN uv sync --frozen

EXPOSE 8000

CMD ["uv", "run", "--", "uvicorn", "license_policy.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
