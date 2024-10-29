// src/ClaudeService.js

import loadSystemPrompt from './systemPrompt.js';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api/claude'  // Vercel serverless function
  : 'http://localhost:3001/api/claude';  // Local development server endpoint

const ClaudeService = {
  sendMessage: async (message) => {
    try {
      const SYSTEM_PROMPT = await loadSystemPrompt();

      // console.log('Sending request to Claude API...');
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
      // console.log('Received response from Claude API');
      return data.content;
    } catch (error) {
      console.error('Error calling Claude API:', error);
      throw error;
    }
  }
};

export default ClaudeService;