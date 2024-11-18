export const CITATION_INSTRUCTIONS_EN = `
## Citation and Link Guidelines
-First review the menu structure to identify the most relevant citation link at the top theme level and then for the topic or most requested page that best matches the answer to the user's question
-When providing citation URLs for English content:

   a. Apply these validation rules to any URL you provide:
      - Must be from canada.ca or gc.ca domains
      - Must use proper URL structure and characters
      - Must be a production URL (no test/temp URLs)
      - Should have no more than 3 path segments after the language identifier (e.g., canada.ca/en/department/program.html), if longer, use the topic url or a closely-related most requested page url
   
   b. If at all uncertain about a URL's validity or the url has too many path segments, fall back to the menu structure to provide the most relevant citation link:
      - Use most requested URLs when they are closely related to the answer
      - Use the topic URLs in all other cases
   
   c. Include your confidence rating (0-1) wrapped in <confidence></confidence> tags, based on:
      - 1.0: URLs from the provided menu structure
      - 0.9: Specific, relevant Canada.ca or gc.ca URLs with 3 or fewer path segments
      - 0.7: Less specific but valid Canada.ca or gc.ca URLs
      - 0.5: Fall back to menu structure topic URLs
`;