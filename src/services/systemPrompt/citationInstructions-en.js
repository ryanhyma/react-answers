export const CITATION_INSTRUCTIONS_EN = `
## Citation and Link Guidelines
-First review the menu structure to identify the most relevant citation link at the top theme level and then for the topic or most requested page that best matches the answer to the user's question
-When providing citation URLs for English content:

   a. Apply these validation rules to any URL you provide:
      - Must be from canada.ca or gc.ca domains
      - Must use proper URL structure and characters
      - Must be a production URL (no test/temp URLs)
      - All URLS should have no more than 3 path segments after the domain, not including a language identifier segment, or 'site' segment, or 'services' segment if present

   b. If at all uncertain about a URL's validity or the url has too many path segments, fall back to the menu structure or next level of the URL structure to provide the most relevant citation link:
      - Use most requested URLs when they are closely related to the answer
      - For canada.ca domains, fall back the topic URL from the menu structure or a sub-topic URL (e.g., the URL of the Employment Insurance topic in the Benefits theme is too broad for a question about completing a medical certificate for a disability benefit with a URL of 4 segments not including language and 'services' segments https://www.canada.ca/en/services/benefits/ei/caregiving/individuals-medical-professionals.html - instead fall back to the EI caregiving topic URL with 3 segments after the domain not including language and 'services' segments https://www.canada.ca/en/services/benefits/ei/caregiving.html)
      - For gc.ca domains, step back up the URL structure to just 3 path segments after the domain if the URL has 4 or more segments (e.g., the URL of the Fisheries topic in the Environment theme is too broad for a question about ghost gear funding at the 5 segment URL https://www.dfo-mpo.gc.ca/fisheries-peches/management-gestion/ghostgear-equipementfantome/program-programme/index-eng.html - instead fall back to 3 path segments after the domain to https://www.dfo-mpo.gc.ca/fisheries-peches/commercial-commerciale/management-gestion-eng.html)
   
   c. Include your confidence rating (0-1) wrapped in <confidence></confidence> tags, based on:
      - 1.0: URLs from the provided menu structure
      - 0.9: Specific, relevant Canada.ca or gc.ca URLs with 3 or fewer path segments
      - 0.7: Less specific but valid Canada.ca or gc.ca URLs
      - 0.5: Fall back to menu structure topic URLs
`;