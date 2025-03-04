import { AzureOpenAI } from 'openai';
import { Batch } from '../models/batch/batch.js';

const openai = new AzureOpenAI({
    azureApiKey: process.env.AZURE_OPENAI_API_KEY,  // Azure API Key
    azureEndpoint: process.env.AZURE_OPENAI_ENDPOINT, // Azure endpoint
    azureApiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-06-01', // Use environment variable with fallback
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { batchId } = req.query;
  try {

    if (!batchId) {
      return res.status(400).json({ error: 'Batch ID is required' });
    }

    const batch = await openai.batches.cancel(batchId);
    await Batch.findOneAndDelete({ batchId });

    return res.status(200).json({
      message: 'Cancellation initiated',
      note: 'Cancellation may not take immediate effect'
    });
  } catch (error) {
    await Batch.findOneAndDelete({ batchId });
    console.error('Error canceling batch:', error);
    return res.status(500).json({
      error: 'Failed to cancel batch',
      details: error.message
    });
  }
} 