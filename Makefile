.PHONY: install-dev-python install-python fmt-ci-python fmt-python lint-python run-tests

install-python: 
	@pip install -r ./backend/requirements.txt

install-dev-python:
	@pip install -r ./backend/requirements-dev.txt

install-frontend-deps:
	cd frontend && npm install

fmt-python:
	black . $(ARGS) --target-version py311

fmt-ci-python:
	black --check . --target-version py311

lint-python:
	flake8 .

run-pytest:
	pytest

docker-build:
	docker build -t gc-signin-ci-build ./backend

