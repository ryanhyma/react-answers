import { BASE_SYSTEM_PROMPT } from './systemPrompt/base.js';
import { SCENARIOS_EN } from './systemPrompt/scenarios-en.js';
import { SCENARIOS_FR } from './systemPrompt/scenarios-fr.js';
import { CITATION_INSTRUCTIONS_EN } from './systemPrompt/citationInstructions-en.js';
import { CITATION_INSTRUCTIONS_FR } from './systemPrompt/citationInstructions-fr.js';
import { CRA_UPDATES_EN } from './systemPrompt/context-cra/cra-updates-en.js';
import { CRA_UPDATES_FR } from './systemPrompt/context-cra/cra-updates-fr.js';
import { CRA_SCENARIOS_EN } from './systemPrompt/context-cra/cra-scenarios-en.js';
import { CRA_SCENARIOS_FR } from './systemPrompt/context-cra/cra-scenarios-fr.js';
import { ESDC_UPDATES_EN } from './systemPrompt/context-esdc/esdc-updates-en.js';
import { ESDC_UPDATES_FR } from './systemPrompt/context-esdc/esdc-updates-fr.js';
import { ESDC_SCENARIOS_EN } from './systemPrompt/context-esdc/esdc-scenarios-en.js';
import { ESDC_SCENARIOS_FR } from './systemPrompt/context-esdc/esdc-scenarios-fr.js';
import { menuStructure_EN } from './systemPrompt/menuStructure_EN.js';
import { menuStructure_FR } from './systemPrompt/menuStructure_FR.js';

async function loadSystemPrompt(language = 'en', department = '') {
  console.log(`🌐 Loading system prompt for language: ${language.toUpperCase()}, department: ${department}`);

  try {
    // Validate imports
    if (!CRA_UPDATES_EN || !CRA_SCENARIOS_EN || !menuStructure_EN || !menuStructure_FR) {
      throw new Error('Required imports are undefined');
    }

    // Select language-specific content
    const menuStructure = language === 'fr' ? menuStructure_FR : menuStructure_EN;
    console.log(`📚 Loaded menu structure: ${language.toUpperCase()}`);
    
    const citationInstructions = language === 'fr' ? CITATION_INSTRUCTIONS_FR : CITATION_INSTRUCTIONS_EN;
    console.log(`📝 Loaded citation instructions: ${language.toUpperCase()}`);

    // Select department-specific content
    const departmentUpdates = department === 'cra'
      ? (language === 'fr' ? CRA_UPDATES_FR : CRA_UPDATES_EN)
      : department === 'esdc'
        ? (language === 'fr' ? ESDC_UPDATES_FR : ESDC_UPDATES_EN)
        : '';
    if (department) {
      console.log(`🏢 Loaded ${department.toUpperCase()} updates: ${language.toUpperCase()}`);
    }

    const departmentScenarios = department === 'cra'
      ? (language === 'fr' ? CRA_SCENARIOS_FR : CRA_SCENARIOS_EN)
      : department === 'esdc'
        ? (language === 'fr' ? ESDC_SCENARIOS_FR : ESDC_SCENARIOS_EN)
        : '';
    if (department) {
      console.log(`📋 Loaded ${department.toUpperCase()} scenarios: ${language.toUpperCase()}`);
    }

    // Use department scenarios if available, otherwise fall back to main scenarios
    const scenarios = departmentScenarios || (language === 'fr' ? SCENARIOS_FR : SCENARIOS_EN);
    console.log(`🎯 Using ${departmentScenarios ? 'department-specific' : 'general'} scenarios: ${language.toUpperCase()}`);

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