resource "aws_ecr_repository" "react_answers" {
  name                 = "react-answers"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
}