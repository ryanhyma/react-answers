// src/ChatGPTService.js

import loadSystemPrompt from './systemPrompt.js';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api/chatgpt'  // Vercel serverless function
  : 'http://localhost:3001/api/chatgpt';  // Local development server endpoint

const ChatGPTService = {
  sendMessage: async (message, conversationHistory = []) => {
    try {
      const SYSTEM_PROMPT = await loadSystemPrompt();
      const isEvaluation = message.includes('<evaluation>');
      
      // Make sure we have a properly formatted message history
      const messageHistory = isEvaluation ? [] : conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          systemPrompt: SYSTEM_PROMPT,
          conversationHistory: messageHistory,  // Now properly formatted
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Error calling ChatGPT API:', error);
      throw error;
    }
  }
};

export default ChatGPTService;