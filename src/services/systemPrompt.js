import { BASE_SYSTEM_PROMPT } from './systemPrompt/base.js';
import { SCENARIOS } from './systemPrompt/scenarios-all.js';
import { CITATION_INSTRUCTIONS_EN } from './systemPrompt/citationInstructions-en.js';
import { CITATION_INSTRUCTIONS_FR } from './systemPrompt/citationInstructions-fr.js';
import { menuStructure_EN } from './systemPrompt/menuStructure_EN.js';
import { menuStructure_FR } from './systemPrompt/menuStructure_FR.js';

// Create a map of department-specific content imports
const departmentModules = {
  cra: {
    updates: () => import('./systemPrompt/context-cra/cra-updates.js').then(m => m.CRA_UPDATES),
    scenarios: () => import('./systemPrompt/context-cra/cra-scenarios.js').then(m => m.CRA_SCENARIOS)
  },
  esdc: {
    updates: () => import('./systemPrompt/context-esdc/esdc-updates.js').then(m => m.ESDC_UPDATES),
    scenarios: () => import('./systemPrompt/context-esdc/esdc-scenarios.js').then(m => m.ESDC_SCENARIOS)
  },
  isc: {
    updates: () => import('./systemPrompt/context-isc/isc-updates.js').then(m => m.ISC_UPDATES),
    scenarios: () => import('./systemPrompt/context-isc/isc-scenarios.js').then(m => m.ISC_SCENARIOS)
  }
  // Add more departments as needed
};

async function loadSystemPrompt(language = 'en', department = '') {
  console.log(`🌐 Loading system prompt for language: ${language.toUpperCase()}, department: ${department}`);

  try {
    // Validate base imports
    if (!menuStructure_EN || !menuStructure_FR) {
      throw new Error('Required imports are undefined');
    }

    // Always start with general scenarios as the base
    let departmentContent = { updates: '', scenarios: SCENARIOS };
    
    // Load department-specific content if available and append to general scenarios
    if (department && departmentModules[department]) {
      try {
        const [updates, scenarios] = await Promise.all([
          departmentModules[department].updates(),
          departmentModules[department].scenarios()
        ]);
        
        departmentContent = {
          updates,
          // Always include general scenarios, then add department-specific ones
          scenarios: `${SCENARIOS}\n\n${scenarios}`
        };
        
        console.log(`🏢 Loaded specialized content for ${department.toUpperCase()}: ${language.toUpperCase()}`);
      } catch (error) {
        console.warn(`Failed to load specialized content for ${department}, using defaults`, error);
      }
    }

    // Select language-specific content
    const menuStructure = language === 'fr' ? menuStructure_FR : menuStructure_EN;
    console.log(`📚 Loaded menu structure: ${language.toUpperCase()}`);
    
    const citationInstructions = language === 'fr' ? CITATION_INSTRUCTIONS_FR : CITATION_INSTRUCTIONS_EN;
    console.log(`📝 Loaded citation instructions: ${language.toUpperCase()}`);

    // Update the department context to use the updates
    const departmentContext = department 
      ? `## Updated Information\n${departmentContent.updates}`
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
        : ''}

      ${departmentContext}

      ${menuStructure}

      ${departmentContent.scenarios}
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