.PHONY: install-dev-python install-python fmt-ci-python fmt-python lint-python run-tests

install-python: 
	@pip install -r ./backend/requirements.txt

install-dev-python:
	@pip install -r ./backend/requirements-dev.txt

fmt-python:
	black . $(ARGS) --target-version py311

fmt-ci-python:
	black --check . --target-version py311

make lint-python:
	flake8 .

run-tests:
	@python -m unittest discover -v -s .
