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
    console.log('[PROD] Batch API request received:', {
      requestCount: req.body.requests?.length,
      systemPromptPresent: !!req.body.systemPrompt,
      firstRequestSample: req.body.requests?.[0]?.substring(0, 100)
    });

    // Add validation
    if (!req.body.requests || !Array.isArray(req.body.requests)) {
      throw new Error('Invalid requests array in payload');
    }

    // Add debug logging
    console.log('Preparing batch request:', {
      systemPromptLength: req.body.systemPrompt?.length,
      requestsCount: req.body.requests?.length,
      sampleRequest: req.body.requests?.[0]
    });

    const batch = await anthropic.beta.messages.batches.create({
      requests: req.body.requests.map((request, index) => ({
        custom_id: `eval-${index}`,
        params: {
          model: "claude-3-5-sonnet-20241022",
          messages: [{ role: "user", content: request }],
          max_tokens: 1024,
          system: req.body.systemPrompt,
          temperature: 0.5
        }
      }))
    });

    console.log('[PROD] Batch created successfully:', {
      batchId: batch.id,
      status: batch.processing_status
    });

    return res.status(200).json({
      batchId: batch.id,
      status: batch.processing_status
    });

  } catch (error) {
    console.error('[PROD] Batch API error:', {
      message: error.message,
      type: error.constructor.name,
      stack: error.stack
    });
    return res.status(500).json({
      error: 'Failed to create batch',
      details: error.message
    });
  }
} 