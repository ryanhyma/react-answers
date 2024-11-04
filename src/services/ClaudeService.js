// src/ClaudeService.js

import loadSystemPrompt from './systemPrompt.js';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api/claude'  // Vercel serverless function
  : 'http://localhost:3001/api/claude';  // Local development server endpoint

const ClaudeService = {
  sendMessage: async (message, conversationHistory = []) => {
    try {
      const SYSTEM_PROMPT = await loadSystemPrompt();
      
      // Only change: check for evaluation and use empty array if true
      const finalHistory = message.includes('<evaluation>') ? [] : conversationHistory;

      console.log('Sending to Claude API:', {
        message,
        conversationHistory: finalHistory,
        systemPromptLength: SYSTEM_PROMPT.length
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationHistory: finalHistory,  // Use the conditional history
          systemPrompt: SYSTEM_PROMPT,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Claude API error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return data.content;
    } catch (error) {
      console.error('Error calling Claude API:', error);
      throw error;
    }
  }
};

export default ClaudeService;