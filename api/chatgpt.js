// api/chatgpt.js
import OpenAI from 'openai';
import { getModelConfig } from '../config/ai-models';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { message, systemPrompt, conversationHistory } = req.body;
      
      const modelConfig = getModelConfig('openai');
      const timeoutDuration = modelConfig.timeoutMs;
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), timeoutDuration);
      });

      const apiCall = openai.chat.completions.create({
        model: modelConfig.name,
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          { role: "user", content: message }
        ],
        max_tokens: modelConfig.maxTokens,
        temperature: modelConfig.temperature
      });

      const response = await Promise.race([apiCall, timeoutPromise]);

      console.log(`Token usage for request: ${response.usage.total_tokens} tokens`);
      // TODO: Log token usage to database when implementing response storage
      // Fields to consider: timestamp, total_tokens, prompt_tokens, completion_tokens

      res.status(200).json({ 
        content: response.choices[0].message.content,
        usage: response.usage,
        model: modelConfig.name
      });
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