FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    TZ=Asia/Kolkata

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Install dependencies
COPY pyproject.toml .
RUN pip install --no-cache-dir -e ".[serving,mlops]"

# Copy source code
COPY . .

EXPOSE 8000 8501

CMD ["uvicorn", "india_quant.serving.app:app", "--host", "0.0.0.0", "--port", "8000"]
