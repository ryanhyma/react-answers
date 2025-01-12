export const CITATION_INSTRUCTIONS = `
## CITATION INSTRUCTIONS
When answering based on Canada.ca or gc.ca content, your response will include a citation link selected and formattedaccording to these instructions: 

### Citation Input Context
Use the following information to select the most relevant citation link:
- User's question and answer in English in answer tags and in the language of the user's question if it wasn't in English
- <topic>relevant topic</topic> (if found by the earlier AI service )
- <topicUrl>topic url</topicUrl> (if found by the earlier AI service)
- <department>relevant department</department> (if found by the earlier AI service)
- <departmentUrl>department url</departmentUrl> (if found by the earlier AI service)
- <referringUrl>Referall URL</referringUrl> (if found - this is the page the user was on when they asked their question)
- the language context(English or French) of the canada.ca page on which the user's question was asked 
- <possible-citation>possible citation urls in English and French from the departmental scenarios provided in this prompt
- <searchResults>search results</searchResults> (if found by the earlier AI service) - use searchResults data to:
      - Identify possible citation urls, particularly if the language context is French
      - Verify the accuracy of a possible citation url
      - Find alternative URLs when primary sources fail verification

### Citation Selection Rules
1. Select ONE English canada.ca or gc.ca URL that best serves the user's next step or directly answers their question, or the matching official French canada.ca or gc.ca URL if the language context is French.
4. Prioritize the user's next logical step over direct sources or the referring url
   Example: For application form questions, provide the eligibility or applicationpage link if there is one,rather than linking a specific application form.there will always be a link on the eligibility page to the correct application page or form for the user's situation
   Example: For questions about signing in to manage their taxes or canada child benefit where the referring url is the My Service Canada Account page, provide the CRA MY account sign in page link
   Example: For questions about renewing a passport where the referring url is the passport renewal page, provide the passport renewal page link again if that's the best answer
   Example: For questions about a particular city's weather forecast, provide the weather.gc.ca page link where they can select their location,rather than the Canada.ca environment page
5. When choosing a citation url, it MUST:
- Use https://
- Include canada.ca or gc.ca
- Be production URLs only
- Follow standard URL formatting
- Be checked by using the "checkUrl", it MUST return live

5. When uncertain about the validity of a citation or unable to find an exact match, follow this fallback hierarchy:
   a. Use the referring URL or searchResults url if it:
      - Is available AND
      - Contains the information that answers the user's question
   b. If referring URL is not suitable, use the topic URL 
   c. If topic URL is not available, use the department URL (either from AI service or derived from referring URL)
   d. If department URL is not suitable, use any relevant canada.ca URL found in the breadcrumb trail that leads toward the answer
   e. When choosing between URLs, always prefer broader, verified URLs over specific URLs that you cannot confirm

### URL Verification Process:
   a. MUST verify ALL URLs using the "checkUrl" tool before responding
   b. If a URL fails verification:
      - Try up to 5 alternative URLs
      - Move to the next level in the fallback hierarchy if no alternatives work


### Citation URL format
-Produce the citation link in this format:
   a. Before the url, add this heading in the language of the user's question, wrapped in xml-like tags: <citation-head>Check your answer and take the next step:</citation-head>
   b. Wrap the url of the final citation link in <citation-url> and </citation-url>

### Confidence Ratings
Include rating in <confidence></confidence> tags:
1.0: High confidence match
0.9: Specific canada.ca/gc.ca URL or referring url (≤5 segments) 
0.7: Less specific associated topic URL or department url
0.5: A fallback URL from a breadcrumb trail



`;
