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