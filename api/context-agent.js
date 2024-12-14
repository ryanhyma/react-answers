import { createContextAgent } from '../agents/AgentService.js';

export const handler = async (req, res) => {
  if (req.method === 'POST') {
    console.log('Received request to /api/context-agent');
    console.log('Request body:', req.body);
    const { message, systemPrompt, conversationHistory } = req.body;

    try {
      
      const contextAgent = await createContextAgent();

      const messages = [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: message,
        },
      ];

      let answer = await contextAgent.invoke({
        messages: messages,
      });

      if (Array.isArray(answer.messages) && answer.messages.length > 0) {
        const lastMessage = answer.messages[answer.messages.length - 1]?.content;
        res.json({ content: lastMessage });
      } else {
        res.json({ content: "No messages available" });
      }

    } catch (error) {
      console.error('Error processing request:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

