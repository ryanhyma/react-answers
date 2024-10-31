// api/claude.js
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  headers: {
    'anthropic-beta': 'prompt-caching-2024-07-31'
  }
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      console.log('Claude API request received');
      const { message, systemPrompt, conversationHistory } = req.body;
      
      // More detailed logging
      console.log('Conversation History:', JSON.stringify(conversationHistory, null, 2));
      console.log('Current Message:', message);
      console.log('System Prompt Length:', systemPrompt?.length);

      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is not set');
      }

      // Convert conversation history to Claude's format and add current message
      const messages = [
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: "user", content: message }
      ];

      // Log the final messages array being sent to Claude
      console.log('Messages being sent to Claude:', JSON.stringify(messages, null, 2));

      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        system: systemPrompt,
        messages: messages,
        max_tokens: 1024
      });

      console.log('Claude Response:', {
        content: response.content[0].text.substring(0, 100) + '...',
        role: response.role,
        usage: response.usage
      });
      
      res.status(200).json({ content: response.content[0].text });
    } catch (error) {
      console.error('Error calling Claude API:', error.message);
      res.status(500).json({ error: 'Error processing your request', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}