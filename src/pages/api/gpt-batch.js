import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { requests, systemPrompt } = req.body;
        
        // Format requests for GPT batch API
        const messages = requests.map(request => ({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: request }
            ],
            model: "gpt-4-turbo-preview",
            max_tokens: 4096
        }));

        // Create batch job
        const batch = await openai.beta.batches.create({
            requests: messages
        });

        return res.status(200).json({ 
            batchId: batch.id,
            status: batch.status
        });
    } catch (error) {
        console.error('GPT Batch creation error:', error);
        return res.status(500).json({ error: 'Failed to create batch' });
    }
} 