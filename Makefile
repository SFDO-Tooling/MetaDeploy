update-deps:
	pip-compile --upgrade requirements/prod.in
	pip-compile --upgrade requirements/dev.in

# Updates just a single package, useful for updating just cumulusci
# Example usage: make update-package PACKAGE="cumulusci"
update-package:
	pip-compile -P $(PACKAGE) --output-file=requirements/prod.txt requirements/prod.in

dev-install:
	pip-sync requirements/*.txt
