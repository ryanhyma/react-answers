import { createContextAgent } from '../agents/AgentService.js';

const invokeAgent = async (agentType, systemPrompt, message) => {
  try {
    const contextAgent = await createContextAgent(agentType);

    const messages = [
      {
        role: "system",
        content: systemPrompt + " Use the contextSearch_function to help determine the context of the user's question.",
      },
      {
        role: "user",
        content: message,
      },
    ];

    const answer = await contextAgent.invoke({
      messages: messages,
    });

    if (Array.isArray(answer.messages) && answer.messages.length > 0) {
      const lastMessage = answer.messages[answer.messages.length - 1]?.content;
      console.log('ContextAgent Response:', {
        content: lastMessage,
        role: answer.messages[answer.messages.length - 1]?.response_metadata.role,
        usage: answer.messages[answer.messages.length - 1]?.response_metadata.usage,
      });
      return lastMessage;
    } else {
      return "No messages available";
    }
  } catch (error) {
    console.error(`Error with ${agentType} agent:`, error);
    throw error;
  }
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    console.log('Received request to /api/context-agent');
    console.log('Request body:', req.body);
    const { message, systemPrompt, conversationHistory } = req.body;

    const agentTypes = ['claude', 'openai', 'cohere'];

    try {
      for (const agentType of agentTypes) {
        try {
          const result = await invokeAgent(agentType, systemPrompt, message);
          res.json({ content: result });
          return;
        } catch (error) {
          // Continue to the next agent type
        }
      }

      // If all agents fail
      res.status(500).json({ error: 'All agents failed to process the request' });

    } catch (error) {
      console.error('Error processing request:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}