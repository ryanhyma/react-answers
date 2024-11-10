import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  headers: {
    'anthropic-beta': 'message-batches-2024-09-24'
  }
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { batchId } = req.query;

      if (!batchId) {
        throw new Error('Batch ID is required');
      }

      const messageBatch = await anthropic.beta.messages.batches.retrieve(batchId);
      console.log(`Batch ${messageBatch.id} processing status is ${messageBatch.processing_status}`);

      // Return the status and results if available
      if (messageBatch.processing_status === 'ended' && messageBatch.results_url) {
        const response = await fetch(messageBatch.results_url);
        const results = await response.text(); // Results are in JSONL format
        
        return res.status(200).json({
          status: messageBatch.processing_status,
          results
        });
      }

      // Otherwise just return the status
      return res.status(200).json({
        status: messageBatch.processing_status
      });

    } catch (error) {
      console.error('Error checking batch status:', error);
      return res.status(500).json({ error: 'Error checking batch status', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 