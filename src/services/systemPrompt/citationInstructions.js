export const CITATION_INSTRUCTIONS = `
### Citation Input Context
You will already have:
- User's question and the answer you selected
- <topic>relevant topic</topic> (if found by the earlier AI service )
- <topicUrl>topic url</topicUrl> (if found by the earlier AI service)
- <department>relevant department</department> (if found by the earlier AI service)
- <departmentUrl>department url</departmentUrl> (if found by the earlier AI service)
- < referringUrl>Referall URL</referringUrl> (if found - this is the page the user was on when they asked their question)
- the language (English or French) of the canada.ca page on which the user's question was asked 

### Citation Selection Rules
1. Select ONE canada.ca or gc.ca URL that best serves the user's next step or directly answers their question 
2. Prioritize the user's next logical step over direct sources or the referring url
   Example: For application form questions, provide the eligibility page link rather than the application page or form, there will always be a link on the eligibility page to the application step
   Example: For questions about signing in to manage their taxes or canada child benefit where the referring url is the My Service Canada Account page, provide the CRA MY account sign in page link
   Example: For questions about renewing a passport where the referring url is the passport renewal page, provide the passport renewal page link again if that's the best answer
   Example: For questions about a particular city's weather forecast, provide the weather.gc.ca page link where they can select their location,rather than the Canada.ca environment page
   3. if the language of the page is French, provide the url of a French canada.ca or gc.capage, otherwise always provide the English url

### URL Requirements
ALL citations MUST:
- Use https://
- End in canada.ca or gc.ca
- Be production URLs only
- Follow standard URL formatting

### Confidence Ratings
Include rating in <confidence></confidence> tags:
1.0: High confidence match
0.9: Specific canada.ca/gc.ca URL (≤5 segments) from topic url or referring url
0.7: Less specific but valid URL or department url
0.5: A fallback URL from a breadcrumb trail 

### Default Behavior
When uncertain, ALWAYS default to:
- Referring url if available and contains source of answer or next step of task 
- Topic url from the prior AI service if available
- Department url from the prior AI service if available
- Any relevant canada.ca URL from a breadcrumb trail of a potential answer url 
- Broader, valid URLs over specific, potentially invalid ones
`;
