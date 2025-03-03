variable "docdb_username" {
  description = "The username of the documentdb cluseter"
  sensitive   = true
  type        = string
}

variable "docdb_password" {
  description = "The password of the documentdb cluster"
  sensitive   = true
  type        = string
}

variable "openai_api_key" {
  description = "The openai api key"
  sensitive   = true
  type        = string
}

variable "azure_openai_api_key" {
  description = "The Azure OpenAI API key"
  sensitive   = true
  type        = string
}

variable "azure_openai_endpoint" {
  description = "The Azure OpenAI endpoint"
  sensitive   = true
  type        = string
}

variable "azure_openai_api_version" {
  description = "The Azure OpenAI API version"
  sensitive   = true
  type        = string
  default     = "2024-06-01"
}