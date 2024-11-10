import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { batchId } = req.body;
        const batch = await openai.batches.cancel(batchId);
        
        // Return the batch object with updated status
        return res.status(200).json({
            id: batch.id,
            status: batch.status, // Will be 'cancelling'
            request_counts: batch.request_counts,
            created_at: batch.created_at,
            cancelling_at: batch.cancelling_at
        });
    } catch (error) {
        console.error('GPT Batch cancellation error:', error);
        return res.status(500).json({ error: 'Failed to cancel batch' });
    }
} 