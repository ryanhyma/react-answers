\import axios from 'axios';

const ANTHROPIC_API_ENDPOINT = '/v1/messages';
const SYSTEM_PROMPT = `You are an AI assistant for the Government of Canada website. Provide helpful information about Canadian government services and programs. Keep responses concise and factual.`;

const ClaudeService = {
  sendMessage: async (message) => {
    console.log('API Key (last 4 chars):', process.env.REACT_APP_ANTHROPIC_API_KEY?.slice(-4) || 'Not found');
    
    try {
      console.log('Sending request to Claude API...');
      const response = await axios.post(
        ANTHROPIC_API_ENDPOINT,
        {
          model: "claude-3-sonnet-20240229",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: message }
          ],
          max_tokens: 1024
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.REACT_APP_ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          }
        }
      );
      console.log('Received response from Claude API');
      return response.data.content[0].text;
    } catch (error) {
      console.error('Error calling Claude API:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      throw error;
    }
  }
};

export default ClaudeService;