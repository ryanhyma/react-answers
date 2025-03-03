output "docdb_username_arn" {
  description = "Arn of the document db username parameter"
  value       = aws_ssm_parameter.docdb_username.arn
}

output "docdb_password_name" {
  description = "The document db password parameter name"
  value       = aws_ssm_parameter.docdb_password.name
}

output "docdb_password_arn" {
  description = "Arn of the document db password parameter"
  value       = aws_ssm_parameter.docdb_password.arn
}

output "docdb_username_name" {
  description = "The document db username"
  value       = aws_ssm_parameter.docdb_username.name
}

output "openai_api_key_arn" {
  description = "Arm of he openai api key parameter"
  value       = aws_ssm_parameter.openai_api_key.arn
}

output "azure_openai_api_key_arn" {
  description = "ARN of the Azure OpenAI API key parameter"
  value       = aws_ssm_parameter.azure_openai_api_key.arn
}

output "azure_openai_endpoint_arn" {
  description = "ARN of the Azure OpenAI endpoint parameter"
  value       = aws_ssm_parameter.azure_openai_endpoint.arn
}

output "azure_openai_api_version_arn" {
  description = "ARN of the Azure OpenAI API version parameter"
  value       = aws_ssm_parameter.azure_openai_api_version.arn
}