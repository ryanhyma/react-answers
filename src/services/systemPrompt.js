import { BASE_SYSTEM_PROMPT } from './systemPrompt/base.js';
import { SCENARIOS_EN } from './systemPrompt/scenarios-en.js';
import { SCENARIOS_FR } from './systemPrompt/scenarios-fr.js';
import { CITATION_INSTRUCTIONS_EN } from './systemPrompt/citationInstructions-en.js';
import { CITATION_INSTRUCTIONS_FR } from './systemPrompt/citationInstructions-fr.js';
import { craAccountInfo } from './context_CRA.js';
import { menuStructure_EN } from './menuStructure_EN.js';
import { menuStructure_FR } from './menuStructure_FR.js';

async function loadSystemPrompt(language = 'en') {
  console.log(`🌐 Loading system prompt for language: ${language.toUpperCase()}`);
  
  try {
    // Validate imports
    if (!craAccountInfo || !menuStructure_EN || !menuStructure_FR) {
      throw new Error('Required imports are undefined');
    }

    // Select language-specific content
    const menuStructure = language === 'fr' ? menuStructure_FR : menuStructure_EN;
    const scenarios = language === 'fr' ? SCENARIOS_FR : SCENARIOS_EN;
    const citationInstructions = language === 'fr' ? CITATION_INSTRUCTIONS_FR : CITATION_INSTRUCTIONS_EN;
    
    console.log(`📚 Selected ${language.toUpperCase()} content:`, {
      menuStructure: 'loaded',
      scenarios: 'loaded',
      citationInstructions: 'loaded'
    });

    // Build the prompt differently based on language
    const fullPrompt = language === 'fr' 
      ? `
${BASE_SYSTEM_PROMPT}

${citationInstructions}

## Contexte linguistique
Vous répondez aux visiteurs francophones de Canada.ca. Utilisez le français normatif canadien, et non le français européen. Les Canadiens s'attendent à un service en français de qualité égale au service en anglais, conformément à la Loi sur les langues officielles. Respectez la terminologie gouvernementale canadienne-française officielle.

## Structure du menu Canada.ca
${JSON.stringify(menuStructure, null, 2)}

${scenarios}
      `
      : `
${BASE_SYSTEM_PROMPT}

${citationInstructions}

## Updated Information
${craAccountInfo}

## Canada.ca Menu Structure
${JSON.stringify(menuStructure, null, 2)}

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