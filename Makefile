CLASS_PATH = metadeploy

update-deps:
	pip-compile --upgrade requirements/prod.in
	pip-compile --upgrade requirements/dev.in

dev-install:
	pip install pip-tools
	pip-sync requirements/*.txt

clean-test:
	rm -rf .tox/
	rm -f .coverage
	rm -rf htmlcov/
	rm -f output.xml
	rm -f report.html
	
# Use CLASS_PATH to run coverage for a subset of tests. 
# $ make coverage CLASS_PATH="cumulusci/core/tests"
coverage: clean-test
	coverage run --source $(CLASS_PATH) -m pytest $(CLASS_PATH)
	coverage report -m
	coverage html
	$(BROWSER) htmlcov/index.html
