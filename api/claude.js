// api/claude.js
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { message, systemPrompt } = req.body;
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        system: systemPrompt,
        messages: [{ role: "user", content: message }],
        max_tokens: 1024
      });
      res.status(200).json({ content: response.content[0].text });
    } catch (error) {
      console.error('Error calling Claude API:', error);
      res.status(500).json({ error: 'Error processing your request' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}