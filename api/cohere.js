// api/cohere.js
import { CohereClient } from 'cohere-ai/v2';

const cohere = new CohereClient({
  token: process.env.REACT_APP_COHERE_API_KEY || process.env.COHERE_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    const response = await cohere.chat({
      model: 'command-r-plus-08-2024',
      messages,
      temperature: 0.5
    });

    return res.status(200).json({ content: response.text });
  } catch (error) {
    console.error('Cohere API error:', error);
    return res.status(500).json({ error: error.message });
  }
}