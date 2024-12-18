import { BASE_SYSTEM_PROMPT } from './systemPrompt/base.js';
import { SCENARIOS } from './systemPrompt/scenarios-all.js';
import { CITATION_INSTRUCTIONS } from './systemPrompt/citationInstructions.js';

// Create a map of department-specific content imports
const departmentModules = {
  CRA: {
    updates: () => import('./systemPrompt/context-cra/cra-updates.js').then(m => m.CRA_UPDATES),
    scenarios: () => import('./systemPrompt/context-cra/cra-scenarios.js').then(m => m.CRA_SCENARIOS)
  },
  ESDC: {
    updates: () => import('./systemPrompt/context-esdc/esdc-updates.js').then(m => m.ESDC_UPDATES),
    scenarios: () => import('./systemPrompt/context-esdc/esdc-scenarios.js').then(m => m.ESDC_SCENARIOS)
  },
  ISC: {
    updates: () => import('./systemPrompt/context-isc/isc-updates.js').then(m => m.ISC_UPDATES),
    scenarios: () => import('./systemPrompt/context-isc/isc-scenarios.js').then(m => m.ISC_SCENARIOS)
  },
  PSPC: {
    updates: () => import('./systemPrompt/context-pspc/pspc-updates.js').then(m => m.PSPC_UPDATES),
    scenarios: () => import('./systemPrompt/context-pspc/pspc-scenarios.js').then(m => m.PSPC_SCENARIOS)
  },
  IRCC: {
    updates: () => import('./systemPrompt/context-ircc/ircc-updates.js').then(m => m.IRCC_UPDATES),
    scenarios: () => import('./systemPrompt/context-ircc/ircc-scenarios.js').then(m => m.IRCC_SCENARIOS)
  }
  // Add more departments as needed
};

async function loadSystemPrompt(language = 'en', department = '') {
  console.log(`🌐 Loading system prompt for language: ${language.toUpperCase()}, department: ${department}`);

  try {


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
          scenarios
        };
        
        console.log(`🏢 Loaded specialized content for ${department.toUpperCase()}: ${language.toUpperCase()}`);
      } catch (error) {
        console.warn(`Failed to load specialized content for ${department}, using defaults`, error);
      }
    }

    // Select language-specific content
    // const menuStructure = language === 'fr' ? menuStructure_FR : menuStructure_EN;
    // console.log(`📚 Loaded menu structure: ${language.toUpperCase()}`);
    
    const citationInstructions = CITATION_INSTRUCTIONS;

    // Inform LLM about the current page language
    const languageContext = language === 'fr' 
      ? "The user is asking the question on a French Government of Canada page. Language context is French."
      : "The user is asking their question on an English Government of Canada page.";

    // Update the department context sections
    const departmentUpdatesSection = department 
      ? `## Updated pages for this department\n${departmentContent.updates}`
      : '';
    
    const departmentScenariosSection = department 
      ? `## Important scenarios for this department\n${departmentContent.scenarios}`
      : `## Important general instructions for all departments\n${SCENARIOS}`;

    // Add current date information
    const currentDate = new Date().toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-CA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const fullPrompt = `
      ## Current Date
      Today is ${currentDate}.

      ## Language Context
      ${languageContext}

      ${BASE_SYSTEM_PROMPT}

      ${citationInstructions}

      ${departmentUpdatesSection}

      ${departmentScenariosSection} //includes the general scenarios
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