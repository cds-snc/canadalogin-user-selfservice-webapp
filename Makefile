.PHONY: install-dev-python install-python fmt-ci-python fmt-python lint-python run-tests

install-python: 
	@pip install -r ./backend/requirements.txt

install-dev-python:
	@pip install -r ./backend/requirements-dev.txt

fmt-format-python:
	black . $(ARGS) --target-version py311

fmt-ci-check-format-python:
	black --check . --target-version py311

lint-python:
	flake8 .

run-tests:
	pytest --cov=backend --cov-report=xml --cov-report=term-missing backend/tests/

docker-build:
	docker build -t gc-signin-ci-build ./backend

