.PHONY: install lint format test test-leakage test-cov run-api run-dashboard docker-up docker-down clean help

PYTHON ?= python
PIP ?= $(PYTHON) -m pip
PYTEST ?= $(PYTHON) -m pytest

help:
	@echo "IndiaQuant Platform - Command Reference"
	@echo "-----------------------------------------"
	@echo "make install         : Install base and dev dependencies"
	@echo "make lint            : Run ruff and mypy code quality checks"
	@echo "make format          : Autoformat codebase using ruff and black"
	@echo "make test            : Run fast unit test suite"
	@echo "make test-leakage    : Run strict look-ahead leakage and point-in-time checks"
	@echo "make test-cov        : Run pytest with test coverage report"
	@echo "make run-api         : Start FastAPI inference microservice"
	@echo "make run-dashboard   : Launch Streamlit analytics dashboard"
	@echo "make docker-up       : Spin up local TimescaleDB, Redis, MLflow, API stack"
	@echo "make docker-down     : Stop local Docker containers"
	@echo "make clean           : Clean temporary caches, bytecode, and test artifacts"

install:
	$(PIP) install --upgrade pip
	$(PIP) install -e ".[dev,serving,mlops,brokers]"

lint:
	$(PYTHON) -m ruff check src tests
	$(PYTHON) -m mypy src tests

format:
	$(PYTHON) -m ruff check --fix src tests
	$(PYTHON) -m black src tests

test:
	$(PYTEST) tests -v

test-leakage:
	$(PYTEST) tests/test_leakage.py -v

test-cov:
	$(PYTEST) --cov=india_quant --cov-report=term-missing --cov-report=html tests

run-api:
	$(PYTHON) -m uvicorn india_quant.serving.app:app --host 0.0.0.0 --port 8000 --reload

run-dashboard:
	$(PYTHON) -m streamlit run src/india_quant/dashboard/app.py --server.port 8501

docker-up:
	docker compose -f infra/docker/docker-compose.yml up -d

docker-down:
	docker compose -f infra/docker/docker-compose.yml down

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	rm -rf build/ dist/ *.egg-info .coverage htmlcov/
