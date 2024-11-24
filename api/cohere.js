// api/cohere.js
const { CohereClient } = require('cohere-ai');

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

module.exports = async function handler(req, res) {
  console.log('Starting Cohere handler');
  console.log('Environment check:', {
    hasApiKey: !!process.env.COHERE_API_KEY,
    nodeEnv: process.env.NODE_ENV
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Request body received');
    const { messages } = req.body;
    
    // Get the latest message and chat history
    const userMessage = messages[messages.length - 1].content;
    const chat_history = messages.slice(1, -1).map(msg => ({
      role: msg.role.toUpperCase(),
      message: msg.content
    }));

    console.log('Making Cohere API call with:', {
      messageLength: userMessage?.length,
      historyLength: chat_history.length
    });

    const response = await cohere.chat({
      model: 'command-r-plus-08-2024',
      message: userMessage,
      chat_history: chat_history,
      temperature: 0.5
    });

    console.log('Cohere API call successful');
    return res.status(200).json({ content: response.text });
  } catch (error) {
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      type: error.constructor.name
    });

    return res.status(500).json({ 
      error: 'An error occurred',
      details: error.message
    });
  }
}