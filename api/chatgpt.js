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
      const timeoutDuration = modelConfig.timeoutMs;
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), timeoutDuration);
      });

      const openAIAgent = await createOpenAIAgent();

      const messages = [
        {
          role: "system",
          content: systemPrompt + " When returning links, verify the link by using the checkURL tool. Always verify the link before downloading. Also, always download the URL to verify the content answers the user question. If you get a 404 or other error, try a different page.",
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
        console.log('Claude Response:', {
          content:lastMessage,
          role: answer.messages[answer.messages.length - 1]?.role,
          usage: answer.messages[answer.messages.length - 1]?.usage,
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