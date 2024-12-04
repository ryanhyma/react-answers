// src/ClaudeService.js

import loadSystemPrompt from './systemPrompt.js';
import buildCitationSystemPrompt from './citationSystemPromptBuilder.js';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api/claude'  // Vercel serverless function
  : 'http://localhost:3001/api/claude';  // Local development server endpoint

const ClaudeService = {
  sendMessage: async (message, conversationHistory = [], lang = 'en') => {
    try {
      console.log(`🤖 Claude Service: Processing message in ${lang.toUpperCase()}`);
      
      // Extract department from message if present
      const departmentMatch = message.match(/<department>(.*?)<\/department>/);
      const department = departmentMatch ? departmentMatch[1] : '';
      
      const SYSTEM_PROMPT = await loadSystemPrompt(lang, department);
      
      // Only change: check for evaluation and use empty array if true
      const finalHistory = message.includes('<evaluation>') ? [] : conversationHistory;

      console.log('Sending to Claude API:', {
        message,
        conversationHistory: finalHistory,
        systemPromptLength: SYSTEM_PROMPT.length,
        service: 'chat'
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationHistory: finalHistory,
          systemPrompt: SYSTEM_PROMPT,
          service: 'chat'
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
  sendCitationMessage: async (message, conversationHistory = [], lang = 'en', department = '') => {
    try {
      console.log(`🤖 Claude Citation Service: Processing message in ${lang.toUpperCase()}`);
      
      // Load the citation system prompt
      const systemPrompt = await buildCitationSystemPrompt(lang, department);
      
      // Only change: check for evaluation and use empty array if true
      const finalHistory = message.includes('<evaluation>') ? [] : conversationHistory;

      console.log('Sending to Claude API:', {
        message,
        conversationHistory: finalHistory,
        systemPromptLength: systemPrompt.length,
        service: 'citation'
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationHistory: finalHistory,
          systemPrompt,
          service: 'citation'
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