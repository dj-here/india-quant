# ==============================================================================
# KidsMentor Backend & Worker - Production Multi-Stage Dockerfile
# Python 3.11-slim with SymPy, FastAPI, SQLAlchemy, and Non-Root User
# ==============================================================================

# --- Stage 1: Builder ---
FROM python:3.11-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# --- Stage 2: Production Runner ---
FROM python:3.11-slim AS runner

WORKDIR /app

# Create unprivileged user for security compliance (Principle: Fail Closed & Secure)
RUN groupadd -g 1001 appgroup && \
    useradd -u 1001 -g appgroup -s /bin/bash -m appuser

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Copy application source code
COPY --chown=appuser:appgroup apps/ ./apps/
COPY --chown=appuser:appgroup prompts/ ./prompts/
COPY --chown=appuser:appgroup evals/ ./evals/

USER appuser

EXPOSE 8000

# Default command runs the FastAPI ASGI server
CMD ["uvicorn", "apps.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
