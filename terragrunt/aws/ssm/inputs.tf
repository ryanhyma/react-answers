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

variable "canada_ca_search_uri" {
  description = "The URI of the Canada.ca search API"
  sensitive   = true
  type        = string
}

variable "canada_ca_search_api_key" {
  description = "The API key of the Canada.ca search API"
  sensitive   = true
  type        = string
}