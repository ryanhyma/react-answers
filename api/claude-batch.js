import Anthropic from '@anthropic-ai/sdk';
import { getModelConfig } from '../config/ai-models.js';

const modelConfig = getModelConfig('anthropic');
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  headers: {
    'anthropic-beta': modelConfig.beta.messageBatches
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

    if (!req.body.requests || !Array.isArray(req.body.requests)) {
      throw new Error('Invalid requests array in payload');
    }

    console.log('Preparing batch request:', {
      systemPromptLength: req.body.systemPrompt?.length,
      requestsCount: req.body.requests?.length,
      sampleRequest: req.body.requests?.[0],
      model: modelConfig.name
    });

    const batch = await anthropic.beta.messages.batches.create({
      requests: req.body.requests.map((request, index) => ({
        custom_id: `eval-${index}`,
        params: {
          model: modelConfig.name,
          messages: [{ role: "user", content: request }],
          max_tokens: modelConfig.maxTokens,
          system: req.body.systemPrompt,
          temperature: modelConfig.temperature
        }
      }))
    });

    console.log('[PROD] Batch created successfully:', {
      batchId: batch.id,
      status: batch.processing_status,
      model: modelConfig.name
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