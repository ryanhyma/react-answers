// api/claude.js
import Anthropic from '@anthropic-ai/sdk';
import { getModelConfig } from '../../config/ai-models';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      console.log('Claude API request received');
      const { message, systemPrompt, conversationHistory, service = 'chat' } = req.body;
      
      // Get model config based on service type (chat or citation)
      const modelConfig = getModelConfig('anthropic', service);
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
        headers: {
          'anthropic-beta': modelConfig.beta.promptCaching
        }
      });

      // More detailed logging
      console.log('Service Type:', service);
      console.log('Conversation History:', JSON.stringify(conversationHistory, null, 2));
      console.log('Current Message:', message);
      console.log('System Prompt Length:', systemPrompt?.length);

      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is not set');
      }

      const messages = [
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: "user", content: message }
      ];

      const response = await anthropic.beta.promptCaching.messages.create({
        model: modelConfig.name,
        system: [{
          type: "text",
          text: systemPrompt,
          cache_control: { type: "ephemeral" }
        }],
        messages: messages,
        max_tokens: modelConfig.maxTokens,
        temperature: modelConfig.temperature
      });

      console.log('Claude Response:', {
        content: response.content[0].text.substring(0, 100) + '...',
        role: response.role,
        usage: response.usage,
        model: modelConfig.name,
        service: service
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
