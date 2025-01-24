// src/ContextService.js
import loadContextSystemPrompt from './contextSystemPrompt.js';
import { getProviderApiUrl, getApiUrl } from '../utils/apiToUrl.js';



const ContextService = {
  sendMessage: async (provider, message, lang = 'en', department = '',referringUrl, searchResults) => {
    try {
      console.log(`🤖 Context Service: Processing message in ${lang.toUpperCase()}`);

      const SYSTEM_PROMPT = await loadContextSystemPrompt(lang, department) + searchResults;
      message += (referringUrl ? `\n<referring-url>${referringUrl}</referring-url>` : '');
      const response = await fetch(getProviderApiUrl(provider, "context"), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          systemPrompt: SYSTEM_PROMPT,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Context API error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return data.content;
    } catch (error) {
      console.error('Error calling Context API:', error);
      throw error;
    }
  },
  contextSearch: async (message) => {
    try {
      const searchResponse = await fetch(getApiUrl("context-search"), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: message }),
      });

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.error('Search API error response:', errorText);
        throw new Error(`HTTP error! status: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      return searchData.content;
    } catch (error) {
      console.error('Error searching context:', error);
      throw error;
    }

  },

  deriveContext: async (provider, question, lang = 'en', department = '',referringUrl) => {
    try {
      console.log(`🤖 Context Service: Analyzing question in ${lang.toUpperCase()}`);
      const searchResults = "<searchResults>" + await ContextService.contextSearch(question) + "</searchResults>";
      console.log('Executed Search:', question);
      return await ContextService.sendMessage(provider, question, lang, department,referringUrl, searchResults);
    } catch (error) {
      console.error('Error deriving context:', error);
      throw error;
    }
  },


  deriveContextBatch: async (entries, lang = 'en', aiService = 'anthropic') => {
    try {
      console.log(`🤖 Context Service: Processing batch of ${entries.length} entries in ${lang.toUpperCase()}`);

      const requests = entries
        .filter(entry => !entry.context || entry.context.trim() === '')
        .map(entry => entry.question);
      const SYSTEM_PROMPT = await loadContextSystemPrompt(lang);

      const searchResults = await Promise.all(
        requests.map(async (request) => {
          return await ContextService.contextSearch(request);
        })
      );

      const updatedRequests = requests.map((request, index) => ({
        message: request,
        systemPrompt: SYSTEM_PROMPT,
        searchResults: "<searchResults>" + searchResults[index] + "</searchResults>",
      }));

      const response = await ContextService.sendBatch(updatedRequests, aiService);
      return {
        batchId: response.batchId,
        batchStatus: response.batchStatus
      };

    } catch (error) {
      console.error('Error deriving context batch:', error);
      throw error;
    }
  },


  sendBatch: async (requests, aiService) => {
    try {
      const response = await fetch(getProviderApiUrl(aiService, "batch-context"), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests,
          aiService
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Context API batch error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error calling Context API batch:', error);
      throw error;
    }
  }
};

export default ContextService;