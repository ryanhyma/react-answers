import ClaudeService from './ClaudeService.js';
import loadSystemPrompt from './systemPrompt.js';
import { getModelConfig } from '../../config/ai-models.js';

const CitationService = {
  findCitation: async (params) => {
    const {
      question,
      answer,
      department,
      referringUrl,
      originalCitationUrl,
      lang = 'en',
      model = 'claude-3-5-haiku-20241022'
    } = params;

    try {
      // Get model config dynamically
      const modelConfig = getModelConfig('anthropic', model);

      // Construct message for citation model
      const message = `
<citation-request>
Question: ${question}
Answer: ${answer}
${department ? `Department: ${department}` : ''}
${referringUrl ? `Referring URL: ${referringUrl}` : ''}
${originalCitationUrl ? `Original Citation: ${originalCitationUrl}` : ''}
</citation-request>`;

      // Add evaluation tag to skip conversation history
      const messageWithEval = `<evaluation>${message}</evaluation>`;

      // Use Claude service with configured model
      const response = await ClaudeService.sendMessage(
        messageWithEval, 
        [], 
        lang,
        modelConfig.name
      );

      // Parse response to extract citation and confidence
      const citationUrlRegex = /<citation-url>(.*?)<\/citation-url>/;
      const confidenceRatingRegex = /<confidence>(.*?)<\/confidence>/;

      const urlMatch = response.match(citationUrlRegex);
      const confidenceMatch = response.match(confidenceRatingRegex);

      return {
        citationUrl: urlMatch ? urlMatch[1] : null,
        confidenceRating: confidenceMatch ? confidenceMatch[1] : '0.1',
        originalResponse: response
      };
    } catch (error) {
      console.error('Error in CitationService:', error);
      return {
        citationUrl: null,
        confidenceRating: '0.1',
        originalResponse: null
      };
    }
  }
};

export default CitationService; 