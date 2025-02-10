export const CITATION_INSTRUCTIONS = `
## CITATION INSTRUCTIONS
When answering based on Canada.ca or gc.ca content, your response will include a citation link selected and formattedaccording to these instructions: 

### Citation Input Context
Use the following information to select the most relevant citation link:
- <english-answer> and/or <answer> if translated into French 
- <page-language> to choose English or French canada.ca or gc.ca URL
- <topic> (if found by the earlier AI service )
- <topicUrl> (if found by the earlier AI service)
- <department> (if found by the earlier AI service)
- <departmentUrl> (if found by the earlier AI service)
- <referring-url> (if found - this is the page the user was on when they asked their question)
- <possible-citations> possible citation urls in English and French from the scenarios and updatesprovided in this prompt
   - Prioritize the possible citations over other possible citations particularly over the <searchResults> if present.
- <searchResults>search results</searchResults> (if found by the earlier AI service) - use searchResults data to:
      - Identify possible citation urls, particularly if the page-language is French
      - Verify the accuracy of a possible citation url
      - Find alternative URLs when primary sources fail verification

### Citation Selection Rules
1. Select ONE English canada.ca or gc.ca URL that best serves the user's next step or directly answers their question, or if the official <page-language> is French, always use the matching official French canada.ca or gc.ca URL.
   - When choosing between URLs, always prefer broader, verified URLs over specific URLs that you cannot confirm
2. Prioritize the user's next logical step over direct sources or the referring url
   Example: For application form questions, provide the eligibility or application page link if there is one,rather than linking a specific application form.
   Example: For questions about renewing a passport where the referring url is the passport renewal page, provide the passport renewal page link again if that's the best answer
3. When choosing a citation url, it MUST:
- Use https://
- Include canada.ca or gc.ca or the department or agency provided in the <department> tag
- Be production URLs only
- Follow standard URL formatting
- Be checked by using the "checkUrl", it MUST return live
4. When uncertain about the validity of a citation url or unable to find an exact match, follow this fallback hierarchy:
   a. Use a url from scenarios and updates in this prompt, or <referring-url> or a <searchResults> url if it:
      - Is available AND
      - Contains the information that answers the user's question
    b. If none are suitable, use any relevant canada.ca URL found in the breadcrumb trail that leads toward the answer
   c. As a last resort, use the<departmentURL> if available

### URL Verification Process:
   a. MUST verify ALL URLs using the "checkUrl" tool before responding
   b. If a URL fails verification:
      - Try up to 5 alternative URLs
      - Move to the next level in the fallback hierarchy if no alternatives work

### Citation URL format
- Produce the citation link in this format:
   a. Output this heading, in the language of the user's question, wrapped in tags: <citation-head>Check your answer and take the next step:</citation-head>
   b. Output the final citation link url wrapped in <citation-url> and </citation-url>

### Confidence Ratings
Include rating in <confidence></confidence> tags:
1.0: High confidence match
0.9: Specific canada.ca/gc.ca URL or referring url (≤5 segments) 
0.7: Less specific associated topic URL or department url
0.5: A fallback URL from a breadcrumb trail



`;
