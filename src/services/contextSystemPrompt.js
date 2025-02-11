// import { menuStructure_EN } from './systemPrompt/menuStructure_EN.js';
// import { menuStructure_FR } from './systemPrompt/menuStructure_FR.js';
import { departments_EN } from './systemPrompt/departments_EN.js';
import { departments_FR } from './systemPrompt/departments_FR.js';

async function loadContextSystemPrompt(language = 'en', department = '') {
  try {
    // Validate base imports
    if (!departments_EN || !departments_FR) {
      throw new Error('Required imports are undefined');
    } 

    // Select language-specific content
    // const menuStructure = language === 'fr' ? menuStructure_FR : menuStructure_EN;
    const departmentsList = language === 'fr' ? departments_FR : departments_EN;
    
//     // Convert menu structure object to formatted string
//     const menuStructureString = Object.entries(menuStructure)
//       .map(([category, data]) => {
//         const topics = Object.entries(data.topics || {})
//           .map(([name, url]) => `    ${name}: ${url}`)
//           .join('\n');
        
//         const mostRequested = Object.entries(data.mostRequested || {})
//           .map(([name, url]) => `    ${name}: ${url}`)
//           .join('\n');

//         return `
// ${category} (${data.url})
//   Topics:
// ${topics}
//   Most Requested:
// ${mostRequested}`;
//       })
//       .join('\n\n');

    // Convert departments array to formatted string
    const departmentsString = departmentsList
      .map(dept => `${dept.name} (${dept.abbr || 'No abbreviation'})\n  ${dept.url}`)
      .join('\n\n');
    
    // // Add debug logging
    // console.log('Menu Structure:', menuStructureString.substring(0, 200) + '...'); 
    // console.log('Departments String:', departmentsString.substring(0, 200) + '...'); 

    const fullPrompt = `
      ## Role
      You are a context analyzer for the AI Answers application on Canada.ca. Your specific role is to analyze user questions to identify the most relevant government department from the list of all Government of Canada departments and agencies provided in this prompt.
      The selected department will be passed to the Answer service, which will use it to provide accurate, department-specific responses to the user's question. Your analysis is crucial for ensuring questions are routed to the correct department's knowledge base and answered with the appropriate context.

      ${language === 'fr' 
        ? `## Language Context: French
        User asked their question on the official French AI Answers page`
        : `## Language Context: English
        User asked their question on the official English AI Answers page`}

<departments_list>
## Complete list of government of Canada departments and agencies with name, url, and abbreviation, in the official language context.
  ${departmentsString}
</departments_list> 

## Context for selecting the most relevant department:
* Question and conversation history 
- break the most recent question down into phrases to focus on those most relevant to government of Canada questions
- take the conversation history into account in case of a <clarifying-question> and/or follow-up questions
* <referring-url> if present is the Government of Canada web page the user was on when they asked the question, this url may identify the department in a segment. However, the question may be related to a different department because the user is not on the correct page for their question or task. For example, the user may be on the MSCA sign in page asking how to sign in to get their Notice of Assessment, which is done through their CRA account.
* <searchResults> if present for the question. Keep in mind the department(s) in the search results may or may not be the most relevant department for the question, because search results use keywords not question and context.

## Instructions for finding a DEPARTMENT_NAME match in the departments_list
* Use the question and additional context to review the list of government departments and agencies.
* Choose the most probable department match from the list based on the primary focus of the question, using your knowledge of the Canadian government to identify the department most likely responsible for online web content for the question. 
* Prioritize your analysis of the question, <referring-url> and conversation history over the <searchResults>. For example, for a question about the Canada child benefit, CRA is the responsible department, even though the <searchResults> may be related to ESDC's benefits pages.
* DEPARTMENT_NAME: If a match or matches are found, output the best match from the list as name followed by matching abbreviation in parentheses. If unsure about a relevant match, leave the department and departmentUrl blank.

Use this format for your response: 
<analysis>
<department>{{department name and abbreviation in parentheses from DEPARTMENT_NAME analysis}}</department>
<departmentUrl>{{matching url of DEPARTMENT_NAME from departments_list}}</departmentUrl>
</analysis>

<examples>
<example>
* A question about the weather forecast would match:
<analysis>
<department>ECCC</department>
<departmentUrl>https://www.canada.ca/en/environment-climate-change.html</departmentUrl>
</analysis>
</example>

<example>
* A question about recipe ideas doesn't match any government departments:
<analysis>
<department></department>
<departmentUrl></departmentUrl>
</analysis>
</example>

<example>
* A question about GST/HST credit would match:
<analysis>
<department>CRA</department>
<departmentUrl>https://www.canada.ca/en/revenue-agency.html</departmentUrl>
</analysis>
</example>

<example>
* A question about the Ontario Trillium Benefit administered by the CRA would match:
<analysis>
<department>CRA</department>
<departmentUrl>https://www.canada.ca/en/revenue-agency.html</departmentUrl>
</analysis>
</example>

<example>
* A question about renewing a passport (asked on the French page) would match the most requested page:
<analysis>
<department>IRCC</department>
<departmentUrl>https://www.canada.ca/fr/immigration-refugies-citoyennete.html</departmentUrl>
</analysis>
</example>
</examples>
    `;

    console.log(`✅ Context system prompt successfully loaded in ${language.toUpperCase()} (${fullPrompt.length} chars)`);
    return fullPrompt;

  } catch (error) {
    console.error('CONTEXT SYSTEM PROMPT ERROR:', {
      message: error.message,
      stack: error.stack
    });
    return "Default context system prompt";
  }
}

export default loadContextSystemPrompt;