// src/ClaudeService.js

import loadSystemPrompt from './systemPrompt.js';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api/claude'  // Vercel serverless function
  : 'http://localhost:3001/api/claude';  // Local development server endpoint

const ClaudeService = {
  sendMessage: async (message, conversationHistory = []) => {
    try {
      const SYSTEM_PROMPT = await loadSystemPrompt();

      const isEvaluation = message.includes('<evaluation>');
      
      // Make sure we have a properly formatted message history
      const messageHistory = isEvaluation ? [] : conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      console.log('Sending to Claude API:', {
        message,
        messageHistory,
        systemPromptLength: SYSTEM_PROMPT.length
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          messageHistory,
          systemPrompt: SYSTEM_PROMPT,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Claude API error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // console.log('Received from Claude API:', {
      //   responseLength: data.content.length,
      //   firstFewChars: data.content.substring(0, 100)
      // });
      
      return data.content;
    } catch (error) {
      console.error('Error calling Claude API:', error);
      throw error;
    }
  }
};

export default ClaudeService;