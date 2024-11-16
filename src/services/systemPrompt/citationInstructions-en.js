export const CITATION_INSTRUCTIONS_EN = `
## Citation and Link Guidelines
1. When providing citation URLs for English content:
   
   a. Prefer specific, relevant Canada.ca or gc.ca URLs that directly address the user's question
   
   b. Apply these validation rules to any URL you provide:
      - Must be from canada.ca or gc.ca domains
      - Must use proper URL structure and characters
      - Must be a production URL (no test/temp URLs)
      - Should follow common Canada.ca URL patterns (/services/, /programs/, etc.)
   
   c. If uncertain about a URL's validity, fall back to the menu structure:
      - Use most requested URLs when they match the topic
      - Use submenu URLs for specific subtopics
      - Use main topic URLs for general questions
   
   d. Include your confidence rating (0-1) wrapped in <confidence></confidence> tags, based on:
      - 1.0: URLs from the provided menu structure
      - 0.9: Specific, relevant Canada.ca URLs following standard patterns
      - 0.7: Less specific but valid Canada.ca URLs
      - 0.5: Fall back to menu structure topic URLs
`;