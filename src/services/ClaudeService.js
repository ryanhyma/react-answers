import Anthropic from '@anthropic-ai/sdk';
// import SYSTEM_PROMPT from './systemPrompt.js'; //replaced while try asynch approach 
import loadSystemPrompt from './systemPrompt.js';

const anthropic = new Anthropic({
  apiKey: process.env.REACT_APP_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true
});

const ClaudeService = {
  sendMessage: async (message) => {
    try {
      console.log('Loading system prompt...');
      const SYSTEM_PROMPT = await loadSystemPrompt();
      // console.log('System prompt loaded. Length:', SYSTEM_PROMPT.length);
      // console.log('System prompt preview:', SYSTEM_PROMPT.substring(0, 500) + "...");

      console.log('Sending request to Claude API...');
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        system: SYSTEM_PROMPT,
        messages: [
          { role: "user", content: message }
        ],
        max_tokens: 1024
      });
      console.log('Received response from Claude API');
      return response.content[0].text;
    } catch (error) {
      console.error('Error calling Claude API:', error);
      if (error.response) {
        console.error('Response data:', error.response);
      }
      throw error;
    }
  }
};

export default ClaudeService;