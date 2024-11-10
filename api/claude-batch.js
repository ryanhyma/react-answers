import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  headers: {
    'anthropic-beta': 'message-batches-2024-09-24'
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('API received request. Body:', {
      requestCount: req.body.requests?.length,
      systemPrompt: req.body.systemPrompt
    });

    // Add validation
    if (!req.body.requests || !Array.isArray(req.body.requests)) {
      throw new Error('Invalid requests array in payload');
    }

    const batch = await anthropic.beta.messages.batches.create({
      betas: ["message-batches-2024-09-24"],
      requests: req.body.requests.map((request, index) => ({
        custom_id: `eval-${index}`,
        params: {
          model: "claude-3-5-sonnet-20241022",
          system: req.body.systemPrompt,
          messages: [{ role: "user", content: request }],
          max_tokens: 1024
        }
      }))
    });

    console.log('Batch created:', {
      id: batch.id,
      status: batch.processing_status
    });

    return res.status(200).json({
      batchId: batch.id,
      status: batch.processing_status
    });

  } catch (error) {
    console.error('Error in claude-batch API:', error);
    return res.status(500).json({
      error: 'Failed to create batch',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 