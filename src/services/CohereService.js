// src/services/CohereService.js

import loadSystemPrompt from './systemPrompt.js';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api/cohere'  // Vercel serverless function
  : 'http://localhost:'+process.env.PORT+'/api/cohere'; 

const CohereService = {
  sendMessage: async (message, conversationHistory = [], lang = 'en') => {
    try {
      console.log(`🤖🇦 Cohere Service: Processing message`);
      const SYSTEM_PROMPT = await loadSystemPrompt(lang);
      
      console.log('Sending to Cohere API:', {
        message: message,
        systemPromptLength: SYSTEM_PROMPT?.length,
        historyLength: conversationHistory.length
      });
  
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...conversationHistory.map(msg => ({
              role: msg.role.toLowerCase(),
              content: msg.content
            })),
            { role: 'user', content: message }
          ]
        }),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cohere API error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Error calling Cohere API:', error);
      throw error;
    }
  }
};

export default CohereService;