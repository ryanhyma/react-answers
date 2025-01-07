import Anthropic from '@anthropic-ai/sdk';
import fetch from 'node-fetch';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  headers: {
    'anthropic-beta': 'message-batches-2024-09-24'
  }
});

const handleAnthropic = async (batchId) => {
  const messageBatch = await anthropic.beta.messages.batches.retrieve(batchId);
  console.log(`Batch ${messageBatch.id} processing status is ${messageBatch.processing_status}`);

  if (messageBatch.processing_status === 'ended' && messageBatch.results_url) {
    return {
      status: "completed",
    };
  } else {
    return {
      status: "processing",
    };
  }

  
};

const handleOpenAI = async (batchId) => {
    return "";
};


export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { batchId, provider } = req.query;

      if (!batchId) {
        throw new Error('Batch ID is required');
      }

      if (!provider) {
        throw new Error('Provider is required');
      }

      let result;
      if (provider === 'anthropic') {
        result = await handleAnthropic(batchId);
      } else if (provider === 'openai') {
        result = await handleOpenAI(batchId);
      } else {
        throw new Error('Unsupported provider');
      }

      return res.status(200).json(result);

    } catch (error) {
      console.error('Error checking batch status:', error);
      return res.status(500).json({ error: 'Error checking batch status', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}