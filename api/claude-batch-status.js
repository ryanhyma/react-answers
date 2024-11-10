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

      const batch = await anthropic.beta.messages.batches.retrieve(batchId);

      // If processing has ended, fetch results
      if (batch.processing_status === 'ended' && batch.results_url) {
        // You might want to stream these results or handle them differently
        // depending on your needs
        const response = await fetch(batch.results_url);
        const results = await response.text(); // Results are in JSONL format
        
        res.status(200).json({
          status: batch.processing_status,
          requestCounts: batch.request_counts,
          results: results
        });
      } else {
        res.status(200).json({
          status: batch.processing_status,
          requestCounts: batch.request_counts
        });
      }

    } catch (error) {
      console.error('Error checking batch status:', error.message);
      res.status(500).json({ error: 'Error checking batch status', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 