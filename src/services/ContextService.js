// src/ContextService.js
import loadContextSystemPrompt from './contextSystemPrompt.js';
const PORT = 3001; // Use a default value if PORT is not set
const API_URL = process.env.NODE_ENV === 'production' ? '/api/context-agent' : 'http://localhost:' + PORT + '/api/context-agent';

const ContextService = {
  sendMessage: async (message, lang = 'en', department = '') => {
    try {
      console.log(`🤖 Context Service: Processing message in ${lang.toUpperCase()}`);

      const SYSTEM_PROMPT = await loadContextSystemPrompt(lang, department);

      const response = await fetch(API_URL, {
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

  deriveContext: async (question, lang = 'en', department = '') => {
    try {
      console.log(`🤖 Context Service: Analyzing question in ${lang.toUpperCase()}`);

      const response = await ContextService.sendMessage(question, lang, department);

      // Parse the XML-style tags from the response
      const topicMatch = response.match(/<topic>([\s\S]*?)<\/topic>/);
      const topicUrlMatch = response.match(/<topicUrl>([\s\S]*?)<\/topicUrl>/);
      const departmentMatch = response.match(/<department>([\s\S]*?)<\/department>/);
      const departmentUrlMatch = response.match(/<departmentUrl>([\s\S]*?)<\/departmentUrl>/);
      const searchResultsMatch = response.match(/<searchResults>([\s\S]*?)<\/searchResults>/);


      return {
        topic: topicMatch ? topicMatch[1] : 'none',
        topicUrl: topicUrlMatch ? topicUrlMatch[1] : '',
        department: departmentMatch ? departmentMatch[1] : '',
        departmentUrl: departmentUrlMatch ? departmentUrlMatch[1] : '',
        searchResults: searchResultsMatch ? searchResultsMatch[1] : ''

      };
    } catch (error) {
      console.error('Error deriving context:', error);
      throw error;
    }
  }
};

export default ContextService;