# 
# Hosted zone for React Answers app
#

resource "aws_route53_zone" "react_answers" {
  name = var.domain

  tags = {
    CostCentre = var.billing_code
    Terraform  = true
  }
}