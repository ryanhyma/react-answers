// api/cohere.js
// api/cohere.js
import { CohereClientV2 } from 'cohere-ai';

const apiKey = process.env.NODE_ENV === 'production' 
  ? process.env.COHERE_API_KEY
  : process.env.REACT_APP_COHERE_API_KEY;

const cohere = new CohereClientV2({
  token: apiKey,
});


export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      console.log('Cohere API request received');
      const { message, systemPrompt, conversationHistory } = req.body;
      
      console.log('Conversation History:', JSON.stringify(conversationHistory, null, 2));
      console.log('Current Message:', message);

      if (!process.env.COHERE_API_KEY) {
        throw new Error('COHERE_API_KEY is not set');
      }

      // Convert conversation history to Cohere's format
      const messages = [
        // Add system prompt as first message if it exists
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: "user", content: message }
      ];

      const response = await cohere.chat({
        model: 'command-r-plus',
        messages: messages,
        temperature: 0.5
      });

      console.log('Cohere Response:', {
        content: response.text.substring(0, 100) + '...',
        tokens: response.tokenCount
      });
      
      res.status(200).json({ content: response.text });
    } catch (error) {
      console.error('Error calling Cohere API:', error.message);
      res.status(500).json({ error: 'Error processing your request', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}