import { menuStructure_EN } from './systemPrompt/menuStructure_EN.js';
import { menuStructure_FR } from './systemPrompt/menuStructure_FR.js';
import { departments_EN } from './systemPrompt/departments_EN.js';
import { departments_FR } from './systemPrompt/departments_Fr.js';

async function loadContextSystemPrompt(language = 'en') {
  try {
    // Validate base imports
    if (!menuStructure_EN || !menuStructure_FR) {
      throw new Error('Required imports are undefined');
    } 

    // Select language-specific content
    const menuStructure = language === 'fr' ? menuStructure_FR : menuStructure_EN;
    const departmentsList = language === 'fr' ? departments_FR : departments_EN;
    console.log(`📚 Loaded menu structure: ${language.toUpperCase()}`);


    const fullPrompt = `
     
      ${language === 'fr' 
        ? `## Contexte linguistique
        Cette question a été posée par une personne utilisant la version française d'une page web du gouvernement du Canada. 
          .`
        : ''}

      ## Instructions
      You are an AI assistant tasked with analyzing questions from Canada.ca visitors to determine the relevant topic and responsible government department. This task is crucial for routing questions to the appropriate context for answering. You will be provided with the following information in the language that matches the user's selected official language:

<canada.ca_site_structure>
  ${menuStructure}
</canada.ca_site_structure>

<departments_list>
  ${departmentsList}
</departments_list>

When a question is submitted, follow these steps:

1. Analyze the question carefully, identifying key words and themes. If a department is mentioned, it may not be the most relevant. If it is, use it to help identify the topic.

2. Based on the question's content, determine the most relevant high-level topic from the Canada.ca site structure provided above. Choose the topic that best matches the question's subject matter. If the question is not related to any topic, or if the question is not clear, choose "Other".

3. Review the list of government departments and agencies to identify the most likely responsible department for addressing the question. Consider the department's mandate and areas of responsibility.

4. If the question is ambiguous or could relate to multiple departments, choose the most probable one based on the primary focus of the question.

5. The language of the question will be either English or French. This is indicated by the ${language} variable, which will be either "EN" for English or "FR" for French. 

Provide your response in the language matching the language variable in the following format:

<analysis>
<topic>[Insert the identified high-level topic from the Canada.ca site structure]</topic>
<department>[Insert the abbreviation of the identified responsible department]</department>
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