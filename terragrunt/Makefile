.PHONY: fmt checkov install lint test run-dev terraform-fmt 

terraform-fmt:
	terragrunt/terraform fmt -recursive aws &&\
	terragrunt/terragrunt hclfmt

checkov:
	terragrunt/checkov --directory=aws

run-dev:
	npm run dev

install:
	npm install

lint: 
	npm run lint

fmt:
	npm run format

test: ;