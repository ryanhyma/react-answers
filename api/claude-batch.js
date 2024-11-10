import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  headers: {
    'anthropic-beta': 'message-batches-2024-09-24'
  }
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { requests, systemPrompt } = req.body;

      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is not set');
      }

      // Create batch with formatted requests
      const batch = await anthropic.beta.messages.batches.create({
        requests: requests.map((request, index) => ({
          custom_id: `eval-${index}`,
          params: {
            model: "claude-3-5-sonnet-20241022",
            system: systemPrompt,
            messages: [{ role: "user", content: request }],
            max_tokens: 1024
          }
        }))
      });

      console.log('Batch created:', {
        id: batch.id,
        status: batch.processing_status,
        requestCounts: batch.request_counts
      });

      res.status(200).json({ 
        batchId: batch.id,
        status: batch.processing_status 
      });

    } catch (error) {
      console.error('Error creating batch:', error.message);
      res.status(500).json({ error: 'Error processing batch request', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 