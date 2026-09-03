
VENV ?= .venv
PYTHON ?= python3.14
VENV_PYTHON := $(VENV)/bin/python
PIP := $(VENV_PYTHON) -m pip

.PHONY: ensure-venv install-python install-dev-python fix-cryptography check-runtime-deps dev-backend-debug-check devcontainer-post-create install-frontend-deps fmt-ci-python fmt-python lint-python run-tests setup-hooks uninstall-hooks check-local-state redis-start redis-stop

# Redis helpers for local debugger startup and teardown.
redis-start:
	@bash -lc '\
		if command -v redis-cli >/dev/null 2>&1 && redis-cli ping >/dev/null 2>&1; then \
			echo "Redis already running."; \
			exit 0; \
		fi; \
		if command -v brew >/dev/null 2>&1; then \
			brew services start redis >/dev/null 2>&1 || true; \
		fi; \
		if command -v redis-cli >/dev/null 2>&1 && redis-cli ping >/dev/null 2>&1; then \
			echo "Redis started via Homebrew service."; \
			exit 0; \
		fi; \
		if command -v redis-server >/dev/null 2>&1; then \
			redis-server --daemonize yes >/dev/null 2>&1 || true; \
		fi; \
		if command -v redis-cli >/dev/null 2>&1 && redis-cli ping >/dev/null 2>&1; then \
			echo "Redis started via redis-server daemon mode."; \
			exit 0; \
		fi; \
		echo "Unable to start Redis automatically. Start Redis manually, then retry debugging." >&2; \
		exit 1; \
	'

redis-stop:
	@bash -lc '\
		if ! command -v redis-cli >/dev/null 2>&1; then \
			echo "redis-cli not found; skipping Redis stop."; \
			exit 0; \
		fi; \
		if ! redis-cli ping >/dev/null 2>&1; then \
			echo "Redis is not running."; \
			exit 0; \
		fi; \
		if command -v brew >/dev/null 2>&1; then \
			brew services stop redis >/dev/null 2>&1 || true; \
		fi; \
		redis-cli shutdown nosave >/dev/null 2>&1 || redis-cli shutdown >/dev/null 2>&1 || true; \
		if redis-cli ping >/dev/null 2>&1; then \
			echo "Redis may still be running; stop it manually if needed."; \
		else \
			echo "Redis stopped."; \
		fi; \
	'

# Recreate the venv when it is missing or was built with the wrong interpreter.
ensure-venv:
	@current_version=$$($(VENV_PYTHON) -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")' 2>/dev/null || echo "missing"); \
	if [ ! -x "$(VENV_PYTHON)" ] || [ "$$current_version" != "3.14" ]; then \
		echo "Recreating .venv with $(PYTHON) (required Python 3.14)"; \
		if [ -z "$(VENV)" ] || [ "$(VENV)" = "/" ]; then echo "Refusing to delete unsafe VENV path: $(VENV)" >&2; exit 1; fi; \
		rm -rf "$(VENV)"; \
		$(PYTHON) -m venv "$(VENV)"; \

	fi

install-python: ensure-venv
	@$(VENV_PYTHON) -m ensurepip --upgrade
	@$(VENV_PYTHON) -m pip install --upgrade pip setuptools wheel
	@$(VENV_PYTHON) -m pip install -r ./backend/requirements.txt

install-dev-python: ensure-venv
	@$(VENV_PYTHON) -m ensurepip --upgrade
	@$(VENV_PYTHON) -m pip install --upgrade pip setuptools wheel
	@$(VENV_PYTHON) -m pip install -r ./backend/requirements-dev.txt
	@$(MAKE) fix-cryptography
	@$(MAKE) check-runtime-deps

fix-cryptography:
	@arch=$$(uname -m); \
	if [ "$$arch" != "arm64" ] && [ "$$arch" != "aarch64" ]; then \
		echo "Skipping cryptography source rebuild (arch=$$arch)."; \
		exit 0; \
	fi
	@echo "Ensuring cryptography is rebuilt from source for this ARM/Python environment..."
	@$(VENV_PYTHON) -m pip uninstall -y cryptography >/dev/null 2>&1 || true
	@$(VENV_PYTHON) -m pip install --no-cache-dir --no-binary cryptography cryptography==48.0.1
	@echo "cryptography rebuilt from source successfully."

check-runtime-deps:
	@echo "[Preflight] Checking runtime dependencies..."
	@$(VENV_PYTHON) -c 'import sys, cryptography, authlib, joserfc; print(f"  Python: {sys.executable}"); print(f"  cryptography: {cryptography.__version__}"); print(f"  authlib: {authlib.__version__}"); print(f"  joserfc: {joserfc.__version__}"); print("[Preflight] ✓ All runtime deps present.")'

dev-backend-debug-check: install-dev-python
	@$(VENV_PYTHON) -X faulthandler -c "from cryptography.hazmat.primitives.asymmetric import rsa; print('rsa-ok')"
	@$(VENV_PYTHON) -m uvicorn app.main:app --app-dir backend --reload --reload-dir backend/app --reload-dir backend/tests --reload-exclude '.venv/*' --reload-exclude '**/site-packages/*' --port 8000 --host 127.0.0.1

# Devcontainer setup entrypoint.
# 1) Ensure backend Python dependencies are installed into the repo .venv.
# 2) Validate cryptography RSA import to catch Illegal instruction issues early.
# 3) Install frontend dependencies.
devcontainer-post-create: install-dev-python
	@$(VENV_PYTHON) -X faulthandler -c "from cryptography.hazmat.primitives.asymmetric import rsa; print('rsa-ok')"
	@$(MAKE) install-frontend-deps

install-frontend-deps:
	cd frontend && npm install

fmt-python:
	black . $(ARGS) --target-version py311

fmt-ci-python:
	black --check . --target-version py311

lint-python:
	flake8 .

check-local-state:
	semgrep --config .semgrep/no-local-state.yml --error backend/app/

run-pytest:
	pytest

docker-build:
	docker build -t gc-signin-ci-build ./backend

setup-hooks:
	@git config --local core.hooksPath .githooks
	@echo "✅ Git hooks enabled (.githooks/pre-commit will run black, flake8, and prettier on commit)"

uninstall-hooks:
	@git config --local --unset core.hooksPath
	@echo "✅ Git hooks disabled"

