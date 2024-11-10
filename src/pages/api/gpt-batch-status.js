import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { batchId } = req.query;
        const batch = await openai.beta.batches.retrieve(batchId);
        
        // If batch is completed, get the results
        let results = null;
        if (batch.status === 'completed') {
            const submissions = await openai.beta.batches.listSubmissions(batchId);
            results = submissions.data;
        }

        return res.status(200).json({
            status: batch.status,
            results,
            created_at: batch.created_at,
            expires_at: batch.expires_at
        });
    } catch (error) {
        console.error('GPT Batch status error:', error);
        return res.status(500).json({ error: 'Failed to get batch status' });
    }
} 