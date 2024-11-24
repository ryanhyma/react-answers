// src/services/CohereService.js

import loadSystemPrompt from './systemPrompt.js';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api/cohere'  // Vercel serverless function
  : 'http://localhost:3001/api/cohere';  // Using port 3001

const CohereService = {
  sendMessage: async (message, conversationHistory = [], lang = 'en') => {
    try {
      console.log(`🤖 Cohere Service: Processing message in ${lang.toUpperCase()}`);
      const SYSTEM_PROMPT = await loadSystemPrompt(lang);
      
      // Format messages according to Cohere's expected structure
      const messages = [
        ...(SYSTEM_PROMPT ? [{ role: 'system', content: SYSTEM_PROMPT }] : []),
        ...conversationHistory.map(msg => ({
          role: msg.role.toLowerCase(), // Ensure role is lowercase as per Cohere's API
          content: msg.content
        })),
        { role: 'user', content: message }
      ];

      // Use empty array for evaluation messages
      const finalMessages = message.includes('<evaluation>') ? [{ role: 'user', content: message }] : messages;

      console.log('Sending to Cohere API:', {
        messages: finalMessages,
        systemPromptLength: SYSTEM_PROMPT?.length
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: finalMessages
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
  },

  sendBatchMessages: async (requests) => {
    try {
      const SYSTEM_PROMPT = await loadSystemPrompt();
      
      const formattedRequests = requests.map(request => ({
        message: request.params.messages[0].content,
        conversationHistory: [], // Empty for evaluation requests
        systemPrompt: SYSTEM_PROMPT
      }));

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batch: true,
          requests: formattedRequests
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create batch request');
      }

      return response.json();
    } catch (error) {
      console.error('Error in sendBatchMessages:', error);
      throw error;
    }
  },

  getBatchStatus: async (batchId) => {
    const response = await fetch(`${API_URL}/status/${batchId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get batch status');
    }

    return response.json();
  },

  getBatchResults: async (resultsUrl) => {
    const response = await fetch(resultsUrl);
    
    if (!response.ok) {
      throw new Error('Failed to get batch results');
    }

    const text = await response.text();
    return text.split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));
  }
};

export default CohereService;