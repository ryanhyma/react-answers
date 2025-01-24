// src/ClaudeService.js

import loadSystemPrompt from './systemPrompt.js';
import { getProviderApiUrl, getApiUrl } from '../utils/apiToUrl.js';




const AnswerService = {

    prepareMessage: async (provider, message, conversationHistory = [], lang = 'en', context, evaluation = false, referringUrl) => {
        console.log(`🤖 AnswerService: Processing message in ${lang.toUpperCase()}`);

        const SYSTEM_PROMPT = await loadSystemPrompt(lang, context);
        if (evaluation) {
            message = "<evaluation>" + message + "</evaluation>";
        }
        // Only change: check for evaluation and use empty array if true
        const finalHistory = message.includes('<evaluation>') ? [] : conversationHistory;
        const messageWithReferrer = `${message}${referringUrl.trim() ? `\n<referring-url>${referringUrl.trim()}</referring-url>` : ''}`;
        console.log('Sending to ' + provider + ' API:', {
            messageWithReferrer,
            conversationHistory: finalHistory,
            systemPromptLength: SYSTEM_PROMPT.length
        });

        return {
            messageWithReferrer,
            conversationHistory: finalHistory,
            systemPrompt: SYSTEM_PROMPT,
        };
    },

    sendMessage: async (provider, message, conversationHistory = [], lang = 'en', context, referringUrl) => {
        try {
            const messagePayload = await AnswerService.prepareMessage(provider, message, conversationHistory, lang, context);
            const response = await fetch(getProviderApiUrl(provider, "message"), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messagePayload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(provider + ' API error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log(provider + ' API response:', data);
            return AnswerService.parseResponse(data.content);
        } catch (error) {
            console.error('Error calling ' + provider + ' API:', error);
            throw error;
        }
    },
    
    sendBatchMessages: async (provider, entries, lang) => {
        try {
            console.log(`🤖 AnswerService: Processing batch of ${entries.length} entries in ${lang.toUpperCase()}`);
            const batchEntries = await Promise.all(entries.map(async (entry) => {
                const messagePayload = await AnswerService.prepareMessage(provider, entry.question, [], lang, entry, true);
                messagePayload.entry = entry;
                return messagePayload;
            }));

            const response = await fetch(getProviderApiUrl(provider, 'batch'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    batch: true,
                    requests: batchEntries
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
    /*getBatchStatus: async (batchId) => {
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
    }*/
};

export default AnswerService;