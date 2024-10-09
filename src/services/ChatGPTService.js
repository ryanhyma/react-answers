import loadSystemPrompt from './systemPrompt.js';
import { OpenAI } from 'openai';

const openAI = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
  });

// const headers = {
//   'Content-Type': 'application/json',
//   'Authorization': `Bearer ${apiKey}`,
// };

const ChatGPTService = {
    sendMessage: async (message) => {
      try {
        const SYSTEM_PROMPT = await loadSystemPrompt();
        console.log('Sending request to ChatGPT API...');
  
        const response = await openAI.chat.completions.create({
          model: "gpt-4o", // Correct model name for the September 2024 release
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: message }
          ],
          max_tokens: 1024,
        });
  
        console.log('Received response from ChatGPT API');
        return response.choices[0].message.content;
  
      } catch (error) {
        console.error('Error calling ChatGPT API:', error);
        if (error.response) {
          console.error('Response data:', error.response);
        }
        throw error;
      }
    }
  };
  
  export default ChatGPTService;
  