output "docdb_username_arn" {
  description = "Arn of the document db username parameter"
  value       = aws_ssm_parameter.docdb_username.arn
}

output "docdb_password_arn" {
  description = "Arn of the document db password parameter"
  value       = aws_ssm_parameter.docdb_password.arn
}