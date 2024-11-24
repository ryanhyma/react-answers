// api/cohere.js
import { CohereClient, CohereError, CohereTimeoutError } from 'cohere-ai/v2';

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;
    
    // Log the incoming messages for debugging
    console.log('Incoming messages:', JSON.stringify(messages, null, 2));

    // Format the messages according to Cohere's API expectations
    const response = await cohere.chat({
      message: messages[messages.length - 1].content, // Get the latest message
      chat_history: messages.slice(0, -1).map(msg => ({
        role: msg.role,
        message: msg.content
      })),
      model: 'command-r-plus-08-2024',
      temperature: 0.5
    });

    return res.status(200).json({ content: response.text });
  } catch (error) {
    if (error instanceof CohereTimeoutError) {
      console.error('Cohere request timed out:', error);
      return res.status(504).json({ 
        error: 'Request timed out',
        details: error.message 
      });
    } else if (error instanceof CohereError) {
      console.error('Cohere API error:', {
        statusCode: error.statusCode,
        message: error.message,
        body: error.body
      });
      return res.status(error.statusCode || 500).json({ 
        error: error.message,
        details: error.body 
      });
    } else {
      console.error('Unexpected error:', error);
      return res.status(500).json({ 
        error: 'An unexpected error occurred',
        details: error.message 
      });
    }
  }
}