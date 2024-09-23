import axios from 'axios';

const ANTHROPIC_API_ENDPOINT = 'https://api.anthropic.com/v1/messages';
const SYSTEM_PROMPT = `You are an AI assistant for the Government of Canada website. Provide helpful information about Canadian government services and programs. Keep responses concise and factual.`;

const ClaudeService = {
  sendMessage: async (message) => {
    try {
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
      return response.data.content[0].text;
    } catch (error) {
      console.error('Error calling Claude API:', error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', error.message);
      }
      throw error;
    }
  }
};

export default ClaudeService;