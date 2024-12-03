import { CITATION_INSTRUCTIONS_EN } from './systemPrompt/citationInstructions-en.js';
import { CITATION_INSTRUCTIONS_FR } from './systemPrompt/citationInstructions-fr.js';

// Map of department-specific sitemaps
const departmentSitemapModules = {
  cra: () => import('./systemPrompt/context-cra/cra-sitemap.js').then(m => m.CRA_SITEMAP),
  esdc: () => import('./systemPrompt/context-esdc/esdc-sitemap.js').then(m => m.ESDC_SITEMAP),
  isc: () => import('./systemPrompt/context-isc/isc-sitemap.js').then(m => m.ISC_SITEMAP)
};

async function buildCitationSystemPrompt(language = 'en', department = '') {
  try {
    const citationInstructions = language === 'fr' ? CITATION_INSTRUCTIONS_FR : CITATION_INSTRUCTIONS_EN;

    // Load department-specific sitemap if available
    let departmentSitemap = '';
    if (department && departmentSitemapModules[department]) {
      try {
        departmentSitemap = await departmentSitemapModules[department]();
        console.log(` Loaded sitemap for ${department.toUpperCase()}`);
      } catch (error) {
        console.warn(`Failed to load sitemap for ${department}, using defaults`, error);
      }
    }

    const fullPrompt = `
      You are a citation verification assistant. Your role is to analyze questions and answers 
      to determine the most appropriate source URL for the information provided.

      ${citationInstructions}

      ${departmentSitemap}

      Always respond with:
      <citation-url>URL_HERE</citation-url>
      <confidence>CONFIDENCE_SCORE</confidence>
      
      Confidence score should be between 0.1 and 1.0, where:
      - 1.0: Perfect match with source content
      - 0.7-0.9: Strong match with some variations
      - 0.4-0.6: Moderate match with significant paraphrasing
      - 0.1-0.3: Weak match or uncertain source
    `.trim();

    console.log(`✅ Citation system prompt loaded in ${language.toUpperCase()} (${fullPrompt.length} chars)`);
    return fullPrompt;

  } catch (error) {
    console.error('CITATION SYSTEM PROMPT ERROR:', error);
    // Return basic citation instructions if there's an error
    return CITATION_INSTRUCTIONS_EN;
  }
}

export default buildCitationSystemPrompt; 