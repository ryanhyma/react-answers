output "aws_docdb_cluster_id" {
  description = "The document db cluster id"
  value       = aws_docdb_cluster.ai-answers-docdb-cluster.id
}

output "aws_docdb_cluster_arn" {
  description = "The document db cluster arn"
  value       = aws_docdb_cluster.ai-answers-docdb-cluster.arn
}