resource "aws_ssm_parameter" "docdb_username" {
  name  = "docdb_username"
  type  = "SecureString"
  value = var.docdb_username

  tags = {
    CostCentre = var.billing_code
    Terraform  = true
  }
}

resource "aws_ssm_parameter" "docdb_password" {
  name  = "docdb_password"
  type  = "SecureString"
  value = var.docdb_password

  tags = {
    CostCentre = var.billing_code
    Terraform  = true
  }
}

resource "aws_ssm_parameter" "openai_api_key" {
  name  = "openai_api_key"
  type  = "SecureString"
  value = var.openai_api_key
}

resource "aws_ssm_parameter" "azure_openai_api_key" {
  name  = "azure_openai_api_key"
  type  = "SecureString"
  value = var.azure_openai_api_key
}

resource "aws_ssm_parameter" "azure_openai_endpoint" {
  name  = "azure_openai_endpoint"
  type  = "SecureString"
  value = var.azure_openai_endpoint
}

resource "aws_ssm_parameter" "azure_openai_api_version" {
  name  = "azure_openai_api_version"
  type  = "SecureString"
  value = var.azure_openai_api_version
}