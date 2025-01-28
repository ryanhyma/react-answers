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
            message: messageWithReferrer,
            conversationHistory: finalHistory,
            systemPrompt: SYSTEM_PROMPT,
        };
    },

    sendMessage: async (provider, message, conversationHistory = [], lang = 'en', context, evaluation, referringUrl) => {
        try {
            const messagePayload = await AnswerService.prepareMessage(provider, message, conversationHistory, lang, context, evaluation, referringUrl);
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
    parseResponse: (text) => {

        if (!text) {
            return { answerType: 'normal', content: '', preliminaryChecks: null, englishAnswer: null };
        }

        let answerType = 'normal';
        let content = text;
        let preliminaryChecks = null;
        let englishAnswer = null;
        let citationHead = null;
        let citationUrl = null;
        let confidenceRating = null;

        // Extract preliminary checks - this regex needs to capture multiline content
        const preliminaryMatch = /<preliminary-checks>([\s\S]*?)<\/preliminary-checks>/s.exec(text);
        if (preliminaryMatch) {
            preliminaryChecks = preliminaryMatch[1].trim();
            content = content.replace(/<preliminary-checks>[\s\S]*?<\/preliminary-checks>/s, '').trim();
        }

        // Extract citation information before processing answers
        const citationHeadMatch = /<citation-head>(.*?)<\/citation-head>/s.exec(content);
        const citationUrlMatch = /<citation-url>(.*?)<\/citation-url>/s.exec(content);

        if (citationHeadMatch) {
            citationHead = citationHeadMatch[1].trim();
        }
        if (citationUrlMatch) {
            citationUrl = citationUrlMatch[1].trim();
        }

        // Extract English answer first
        const englishMatch = /<english-answer>(.*?)<\/english-answer>/s.exec(content);
        if (englishMatch) {
            englishAnswer = englishMatch[1].trim();
            content = englishAnswer;  // Use English answer as content for English questions
        }

        // Extract main answer if it exists
        const answerMatch = /<answer>(.*?)<\/answer>/s.exec(text);
        if (answerMatch) {
            content = answerMatch[1].trim();
        }

        // Check response types
        if (content.includes('<not-gc>')) {
            answerType = 'not-gc';
            content = content.replace(/<\/?not-gc>/g, '').trim();
        } else if (content.includes('<pt-muni>')) {
            answerType = 'pt-muni';
            content = content.replace(/<\/?p?-?pt-muni>/g, '').trim();
        } else if (content.includes('<clarifying-question>')) {
            answerType = 'question';
            content = content.replace(/<\/?clarifying-question>/g, '').trim();
        }
        const confidenceRatingRegex = /<confidence>(.*?)<\/confidence>/s;
        const confidenceMatch = text.match(confidenceRatingRegex);

        if (confidenceMatch) {
            confidenceRating = confidenceMatch[1].trim();
        }

        const paragraphs = content.split(/\n+/);

        return { answerType, content, preliminaryChecks, englishAnswer, citationHead, citationUrl, paragraphs, confidenceRating };

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