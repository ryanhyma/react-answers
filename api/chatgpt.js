// api/chatgpt.js
import OpenAI from 'openai';
import { getModelConfig } from '../config/ai-models.js';
import { createOpenAIAgent } from '../agents/AgentService.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { message, systemPrompt, conversationHistory } = req.body;
      
      const modelConfig = getModelConfig('openai');
      console.log('Using OpenAI model:', modelConfig);

      const openAIAgent = await createOpenAIAgent();

      const messages = [
        {
          role: "system",
          content: systemPrompt,
        },
        ...conversationHistory,
        {
          role: "user",
          content: message,
        },
      ];

      let answer = await openAIAgent.invoke({
        messages: messages,
      });

      if (Array.isArray(answer.messages) && answer.messages.length > 0) {
        const lastMessage = answer.messages[answer.messages.length - 1]?.content;
        console.log('ChatGPT Response:', {
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
      console.error('Error calling ChatGPT API:', {
        message: error.message,
        name: error.name
      });
      
      const statusCode = error.message === 'Request timed out' ? 504 : 500;
      res.status(statusCode).json({ 
        error: 'Error processing your request', 
        details: error.message 
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}