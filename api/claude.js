// api/claude.js
import Anthropic from '@anthropic-ai/sdk';
//use prompt caching beta
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  headers: {
    'anthropic-beta': 'prompt-caching-2024-07-31'
  }
});
// In api/claude.js, update the handler:
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

      // Convert conversation history if it exists to Claude's format and add current message
      const messages = [
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: "user", content: message }
      ];

      // Log the final messages array being sent to Claude
      // console.log('Messages being sent to Claude:', JSON.stringify(messages, null, 2));

      const response = await anthropic.beta.promptCaching.messages.create({
        model: "claude-3-5-sonnet-20241022",
        system: [{
          type: "text",
          text: systemPrompt,
          cache_control: { type: "ephemeral" }
        }],
        messages: messages,
        max_tokens: 1024,
        temperature: 0.5  // Middle ground for balanced responses
      });

      // Add detailed cache performance logging
      // console.log('Cache Performance:', {
      //   cacheCreation: response.usage.cache_creation_input_tokens + ' tokens written to cache',
      //   cacheHits: response.usage.cache_read_input_tokens + ' tokens read from cache',
      //   uncachedInput: response.usage.input_tokens + ' tokens processed without cache',
      //   totalInput: response.usage.input_tokens + 
      //              response.usage.cache_creation_input_tokens + 
      //              response.usage.cache_read_input_tokens + ' total input tokens',
      //   outputTokens: response.usage.output_tokens + ' output tokens'
      // });

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
