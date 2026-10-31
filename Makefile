.PHONY: verify security test
verify: test
	@echo "AZAZ BUSINESS verification gate passed"

test:
	npm test

security:
	npm run security
