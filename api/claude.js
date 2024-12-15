// api/claude.js
import Anthropic from '@anthropic-ai/sdk';
import { getModelConfig } from '../config/ai-models.js';
import { createClaudeAgent } from '../agents/AgentService.js';

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
      const { message, systemPrompt, conversationHistory } = req.body;
      
      // // More detailed logging
      // console.log('Conversation History:', JSON.stringify(conversationHistory, null, 2));
      // console.log('Current Message:', message);
      // console.log('System Prompt Length:', systemPrompt?.length);

      if (!process.env.ANTHROPIC_API_KEY && !process.env.REACT_APP_ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is not set');
      }

      const claudeAgent = await createClaudeAgent();

      const messages = [
        {
          role: "system",
          content: systemPrompt + "### YOU MUST CHECK THE citation URL with checkUrl_function ###",
        },
        ...conversationHistory,
        {
          role: "user",
          content: message,
        },
      ];

      let answer = await claudeAgent.invoke({
        messages: messages,
      });

      if (Array.isArray(answer.messages) && answer.messages.length > 0) {
        const lastMessage = answer.messages[answer.messages.length - 1]?.content;
        console.log('Claude Response:', {
          content:lastMessage,
          role: answer.messages[answer.messages.length - 1]?.response_metadata.role,
          usage: answer.messages[answer.messages.length - 1]?.response_metadata.usage,
          model: modelConfig.name
        });
        res.json({ content: lastMessage });
      } else {
        res.json({ content: "No messages available" });
      }
      
      
    } catch (error) {
      console.error('Error calling Claude API:', error.message);
      res.status(500).json({ error: 'Error processing your request', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
