// api/claude.js
import { createClaudeAgent } from '../agents/AgentService.js';


export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      console.log('Claude API request received');
      const { message, systemPrompt, conversationHistory } = req.body;
      console.log('Request body:', req.body);

    
      const claudeAgent = await createClaudeAgent();

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

      let answer = await claudeAgent.invoke({
        messages: messages,
      });

      if (Array.isArray(answer.messages) && answer.messages.length > 0) {
        answer.messages.forEach((msg, index) => {
          console.log(`Claude Response [${index}]:`, {
            content: msg.content,
            classType: msg.constructor.name,
          });
        });
        const lastMessage = answer.messages[answer.messages.length - 1]?.content;
        if (!lastMessage || lastMessage.trim() === '') {
          throw new Error('Claude returned nothing in the response');
        }
        res.json({ content: lastMessage });
      } else {
        throw new Error('Claude returned no messages');
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