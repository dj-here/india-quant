# ==============================================================================
# KidsMentor - Autonomous Multi-Agent AI Tutoring Platform
# ==============================================================================

.PHONY: help dev test eval seed worker lint clean

PYTHON := .venv/Scripts/python
UVICORN := .venv/Scripts/uvicorn
PYTEST := .venv/Scripts/pytest

help:
	@echo "KidsMentor Engineering Tasks:"
	@echo "  make dev      - Start FastAPI backend with hot reloading (port 8000)"
	@echo "  make test     - Run full automated pytest test suite"
	@echo "  make eval     - Run 210-case adversarial red-team safety evaluation harness"
	@echo "  make seed     - Seed NCERT Maths, Science, and 12 Life Values modules"
	@echo "  make worker   - Run background worker maintenance cycle"
	@echo "  make lint     - Run flake8 / ruff code quality checks"

dev:
	$(UVICORN) apps.api.main:app --host 127.0.0.1 --port 8000 --reload

test:
	$(PYTEST) tests/ -v

eval:
	$(PYTHON) evals/runner.py

seed:
	$(PYTHON) -m apps.api.seed.curriculum_seed
	$(PYTHON) -m apps.api.seed.values_seed

worker:
	$(PYTHON) -m apps.worker.worker

clean:
	rm -rf __pycache__ .pytest_cache *.pyc
