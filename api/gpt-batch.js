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
        
        // First, create a JSONL file with the requests
        const jsonlContent = requests.map(request => JSON.stringify({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: request }
            ],
            model: "gpt-4-turbo-preview",
            max_tokens: 4096
        })).join('\n');

        // Upload the JSONL file
        const file = await openai.files.create({
            file: Buffer.from(jsonlContent),
            purpose: 'batch'
        });

        // Create the batch
        const batch = await openai.createBatch({
            input_file_id: file.id,
            endpoint: "/v1/chat/completions",
            completion_window: "24h"
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