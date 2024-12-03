import ClaudeService from './ClaudeService.js';

const CitationService = {
  findCitation: async (params) => {
    const {
      question,
      answer,
      department,
      referringUrl,
      originalCitationUrl,
      lang = 'en'
    } = params;

    try {
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

      // Let ClaudeService handle the system prompt
      const response = await ClaudeService.sendCitationMessage(
        messageWithEval, 
        [], 
        lang,
        department
      );

      // Parse response to extract citation and header
      const citationUrlRegex = /<citation-url>(.*?)<\/citation-url>/;
      const citationHeaderRegex = /<citation-head>(.*?)<\/citation-head>/;
      
      const urlMatch = response.match(citationUrlRegex);
      const headerMatch = response.match(citationHeaderRegex);

      return {
        citationUrl: urlMatch ? urlMatch[1].trim() : null,
        citationHeader: headerMatch ? headerMatch[1].trim() : null,
        originalResponse: response
      };
    } catch (error) {
      console.error('Error in CitationService:', error);
      return {
        citationUrl: null,
        citationHeader: null,
        originalResponse: null
      };
    }
  }
};

export default CitationService; 