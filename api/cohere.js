// api/cohere.js
import { CohereClient } from 'cohere-ai';

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  try {
    console.log('Cohere API request received');
    const { messages } = req.body;
    
    // Get the latest message and chat history
    const userMessage = messages[messages.length - 1].content;
    const chat_history = messages.slice(1, -1).map(msg => ({
      role: msg.role.toUpperCase(),
      message: msg.content
    }));

    // Log the request details
    console.log('Processing request:', {
      messageLength: userMessage?.length,
      historyLength: chat_history.length,
      model: 'command-r-plus-08-2024'
    });

    if (!process.env.COHERE_API_KEY) {
      throw new Error('COHERE_API_KEY is not set');
    }

    const response = await cohere.chat({
      model: 'command-r-plus-08-2024',
      message: userMessage,
      chat_history: chat_history,
      temperature: 0.5
    });

    console.log('Cohere Response:', {
      content: response.text.substring(0, 100) + '...',
      response_id: response.response_id
    });

    res.status(200).json({ content: response.text });
  } catch (error) {
    console.error('Error calling Cohere API:', error.message);
    res.status(500).json({ 
      error: 'Error processing your request', 
      details: error.message 
    });
  }
}