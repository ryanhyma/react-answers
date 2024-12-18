// api/claude.js
import Anthropic from '@anthropic-ai/sdk';
import { getModelConfig } from '../config/ai-models.js';

// Same as your claude.js endpoint, but with this change:
const modelConfig = getModelConfig('anthropic');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  headers: {
    'anthropic-beta': modelConfig.beta.promptCaching
  }
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      console.log('Claude API request received');
      const { message, systemPrompt } = req.body;
      
      // More detailed logging
      // console.log('Current Message:', message);
      console.log('System Prompt Length:', systemPrompt?.length);

      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is not set');
      }

      const messages = [
        { role: "user", content: message }
      ];

      const response = await anthropic.beta.promptCaching.messages.create({
        model: "claude-3-5-haiku-20241022", //I'm cheating here to use the Haiku model without adding to the config file 
        system: [{
          type: "text",
          text: systemPrompt,
          cache_control: { type: "ephemeral" }
        }],
        messages: messages,
        max_tokens: modelConfig.maxTokens,
        temperature: modelConfig.temperature
      });

      // console.log('Claude Response:', {
      //   content: response.content[0].text.substring(0, 100) + '...',
      //   role: response.role,
      //   usage: response.usage,
      //   model: modelConfig.name
      // });
      
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
