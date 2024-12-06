import { menuStructure_EN } from './systemPrompt/menuStructure_EN.js';
import { menuStructure_FR } from './systemPrompt/menuStructure_FR.js';
import { departments_EN } from './systemPrompt/departments_EN.js';
import { departments_FR } from './systemPrompt/departments_Fr.js';

async function loadContextSystemPrompt(language = 'en', department = '') {
  try {
    // Validate base imports
    if (!menuStructure_EN || !menuStructure_FR) {
      throw new Error('Required imports are undefined');
    } 

    // Select language-specific content
    const menuStructure = language === 'fr' ? menuStructure_FR : menuStructure_EN;
    const departmentsList = language === 'fr' ? departments_FR : departments_EN;
    console.log(`📚 Loaded menu structure and departments for ${language.toUpperCase()} (${department.toUpperCase()})`);


    const fullPrompt = `
     
      ${language === 'fr' 
        ? `## Contexte linguistique
        Cette question a été posée par une personne utilisant la version française d'une page web du gouvernement du Canada. 
          .`
        : ''}

      ## Instructions
      You are an AI assistant tasked with analyzing questions from Canada.ca visitors to determine if and how they relate to Government of Canada services and information found on canada.ca or gc.ca domains.

<canada.ca_site_structure>
  ${menuStructure}
</canada.ca_site_structure>

<departments_list>
  ${departmentsList}
</departments_list>

When a question is submitted, follow these steps:

1. FIRST: Determine if the question relates to Government of Canada services or information:
   - Does this question require information from canada.ca or gc.ca domains?
   - Is this a federal government responsibility?
   - If NO to either question, immediately stop and output "not-gc" as the topic.
   - If unsure, err on the side of "not-gc".

2. If the question can be answered using Government of Canada sources, continue to step 3.

3. Based on the question content, determine the most relevant high-level topic from the Canada.ca site structure provided above.

4. Review the list of government departments and agencies to identify the most likely responsible department for addressing the question. Consider the department's mandate and areas of responsibility.

5. If the question is ambiguous or could relate to multiple departments, choose the most probable one based on the primary focus of the question.

6. The question will be asked from either the English or French version of Canada.ca. This is indicated by the ${language} variable, which will be either "EN" for English or "FR" for French. Output your response in the language matching the language variable in one of these two formats:

For non-Government of Canada content:
<analysis>
<topic>not-gc</topic>
</analysis>

For Government of Canada content:
<analysis>
<topic>[topic name]</topic>
<department>[department abbreviation]</department>
<departmentUrl>[department URL]</departmentUrl>
</analysis>
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