// src/ClaudeService.js

import loadSystemPrompt from './systemPrompt.js';


const PORT = 3001; // Use a default value if PORT is not set

const API_URL = process.env.NODE_ENV === 'production'
  ? '/api/claude'  // Vercel serverless function
  : `http://localhost:${PORT}/api/claude`;  // Local development server endpoint


const ClaudeService = {
  sendMessage: async (message, conversationHistory = [], lang = 'en', context) => {
    try {
      console.log(`🤖 Claude Service: Processing message in ${lang.toUpperCase()}`);

      const SYSTEM_PROMPT = await loadSystemPrompt(lang, context);

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
  },
  sendBatchMessages: async (requests) => {
    try {
      const SYSTEM_PROMPT = await loadSystemPrompt();

      // Format the requests to match the expected server format
      const formattedRequests = requests.map(request => ({
        message: request.params.messages[0].content,
        conversationHistory: [],  // Empty for evaluation requests
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

export default ClaudeService;