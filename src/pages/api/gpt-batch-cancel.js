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
        await openai.beta.batches.cancel(batchId);
        
        return res.status(200).json({ status: 'cancelled' });
    } catch (error) {
        console.error('GPT Batch cancellation error:', error);
        return res.status(500).json({ error: 'Failed to cancel batch' });
    }
} 