// src/ChatGPTService.js

import loadSystemPrompt from './systemPrompt.js';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api/chatgpt'  // Vercel serverless function
  : 'http://localhost:3001/api/chatgpt';  // Local Express server

const ChatGPTService = {
  sendMessage: async (message) => {
    try {
      const SYSTEM_PROMPT = await loadSystemPrompt();
      console.log('Sending request to ChatGPT API...');

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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received response from ChatGPT API');
      return data.content;
    } catch (error) {
      console.error('Error calling ChatGPT API:', error);
      throw error;
    }
  }
};

export default ChatGPTService;