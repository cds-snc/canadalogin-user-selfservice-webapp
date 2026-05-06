.PHONY: install-dev-python install-python fmt-ci-python fmt-python lint-python run-tests setup-hooks uninstall-hooks check-local-state

install-python: 
	@pip3 install -r ./backend/requirements.txt

install-dev-python:
	@pip3 install -r ./backend/requirements-dev.txt

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

