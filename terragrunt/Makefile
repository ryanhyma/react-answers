.PHONY: fmt checkov

fmt:
	terraform fmt -recursive aws &&\
	terragrunt hclfmt

checkov:
	terragrunt/checkov --directory=aws