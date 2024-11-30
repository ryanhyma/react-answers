import { BASE_SYSTEM_PROMPT } from './systemPrompt/base.js';
import { SCENARIOS_EN } from './systemPrompt/scenarios-en.js';
import { SCENARIOS_FR } from './systemPrompt/scenarios-fr.js';
import { CITATION_INSTRUCTIONS_EN } from './systemPrompt/citationInstructions-en.js';
import { CITATION_INSTRUCTIONS_FR } from './systemPrompt/citationInstructions-fr.js';
import { craAccountInfo } from './systemPrompt/context_CRA.js';
import { menuStructure_EN } from './systemPrompt/menuStructure_EN.js';
import { menuStructure_FR } from './systemPrompt/menuStructure_FR.js';

async function loadSystemPrompt(language = 'en', department = '') {
  console.log(`🌐 Loading system prompt for language: ${language.toUpperCase()}, department: ${department}`);

  try {
    // Validate imports
    if (!craAccountInfo || !menuStructure_EN || !menuStructure_FR) {
      throw new Error('Required imports are undefined');
    }

    // Select language-specific content
    const menuStructure = language === 'fr' ? menuStructure_FR : menuStructure_EN;
    const scenarios = language === 'fr' ? SCENARIOS_FR : SCENARIOS_EN;
    const citationInstructions = language === 'fr' ? CITATION_INSTRUCTIONS_FR : CITATION_INSTRUCTIONS_EN;

    // Add current date information
    const currentDate = new Date().toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-CA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // TODO: Selectively load department-specific context
    // Only include CRA account info if the department is CRA
    const departmentContext = department === 'cra' 
      ? `## Updated Information\n${craAccountInfo}`
      : '';

    const fullPrompt = `
      ${BASE_SYSTEM_PROMPT}

      ## Current Date
      Today is ${currentDate}.

      ${citationInstructions}

      ${language === 'fr' 
        ? `## Contexte linguistique
          Vous répondez aux visiteurs francophones de Canada.ca. Utilisez le français normatif canadien, et non le français européen. Les Canadiens s'attendent à un service en français de qualité égale au service en anglais, conformément à la Loi sur les langues officielles. Respectez la terminologie gouvernementale canadienne-française officielle.`
        : departmentContext}

      ${menuStructure}

      ${scenarios}
    `;

    console.log(`✅ System prompt successfully loaded in ${language.toUpperCase()} (${fullPrompt.length} chars)`);
    return fullPrompt;

  } catch (error) {
    console.error('SYSTEM PROMPT ERROR:', {
      message: error.message,
      stack: error.stack
    });

    return BASE_SYSTEM_PROMPT;
  }
}

export default loadSystemPrompt;