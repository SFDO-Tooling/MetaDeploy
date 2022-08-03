update-deps:
	pip-compile --upgrade requirements/prod.in
	pip-compile --upgrade requirements/dev.in

# Updates a single package, useful for updating cumulusci only
# Example usage: make update-package PACKAGE="cumulusci"
update-package:
	pip-compile -P $(PACKAGE) --output-file=requirements/prod.txt requirements/prod.in

dev-install:
	pip-sync requirements/*.txt
