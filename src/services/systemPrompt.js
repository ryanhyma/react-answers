import { BASE_SYSTEM_PROMPT } from './systemPrompt/base.js';
import { SCENARIOS } from './systemPrompt/scenarios-all.js';
import { CITATION_INSTRUCTIONS_EN } from './systemPrompt/citationInstructions-en.js';
import { CITATION_INSTRUCTIONS_FR } from './systemPrompt/citationInstructions-fr.js';
import { CRA_UPDATES } from './systemPrompt/context-cra/cra-updates.js';
import { CRA_SCENARIOS } from './systemPrompt/context-cra/cra-scenarios.js';
import { ESDC_UPDATES } from './systemPrompt/context-esdc/esdc-updates.js';
import { ESDC_SCENARIOS } from './systemPrompt/context-esdc/esdc-scenarios.js';
import { menuStructure_EN } from './systemPrompt/menuStructure_EN.js';
import { menuStructure_FR } from './systemPrompt/menuStructure_FR.js';

async function loadSystemPrompt(language = 'en', department = '') {
  console.log(`🌐 Loading system prompt for language: ${language.toUpperCase()}, department: ${department}`);

  try {
    // Validate imports
    if (!CRA_UPDATES || !CRA_SCENARIOS || !menuStructure_EN || !menuStructure_FR) {
      throw new Error('Required imports are undefined');
    }

    // Select language-specific content
    const menuStructure = language === 'fr' ? menuStructure_FR : menuStructure_EN;
    console.log(`📚 Loaded menu structure: ${language.toUpperCase()}`);
    
    const citationInstructions = language === 'fr' ? CITATION_INSTRUCTIONS_FR : CITATION_INSTRUCTIONS_EN;
    console.log(`📝 Loaded citation instructions: ${language.toUpperCase()}`);

    // Select department-specific content
    const departmentUpdates = department === 'cra'
      ? CRA_UPDATES
      : department === 'esdc'
        ? ESDC_UPDATES
        : '';
    if (department && (department === 'cra' || department === 'esdc')) {
      console.log(`🏢 Loaded ${department.toUpperCase()} updates: ${language.toUpperCase()}`);
    }

    const departmentScenarios = department === 'cra'
      ? CRA_SCENARIOS
      : department === 'esdc'
        ? ESDC_SCENARIOS
        : '';
    if (department && (department === 'cra' || department === 'esdc')) {
      console.log(`📋 Loaded ${department.toUpperCase()} scenarios: ${language.toUpperCase()}`);
    }

    // Always load general scenarios AND department scenarios if available
    const scenarios = departmentScenarios 
      ? `${SCENARIOS}\n\n${departmentScenarios}`
      : SCENARIOS;
    console.log(`🎯 Loaded general scenarios and ${departmentScenarios ? 'department-specific' : 'no department'} scenarios: ${language.toUpperCase()}`);

    // Update the department context to use the updates
    const departmentContext = department 
      ? `## Updated Information\n${departmentUpdates}`
      : '';

    // Add current date information
    const currentDate = new Date().toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-CA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

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