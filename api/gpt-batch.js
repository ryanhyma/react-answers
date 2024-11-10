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
        
        console.log('Starting GPT batch creation with:', {
            requestCount: requests.length,
            systemPromptLength: systemPrompt?.length
        });

        // First, create a JSONL file with the requests
        const jsonlContent = requests.map(request => JSON.stringify({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: request }
            ],
            model: "gpt-4-turbo-preview",
            max_tokens: 4096
        })).join('\n');

        console.log('Created JSONL content');

        // Upload the JSONL file
        const file = await openai.files.create({
            file: Buffer.from(jsonlContent),
            purpose: 'batch'
        });

        console.log('File uploaded:', file.id);

        // Create the batch
        const batch = await openai.batches.create({
            input_file_id: file.id,
            endpoint: "/v1/chat/completions"
        });

        console.log('Batch created:', batch.id);

        return res.status(200).json({ 
            batchId: batch.id,
            status: batch.status
        });
    } catch (error) {
        console.error('GPT Batch creation error:', {
            message: error.message,
            name: error.name,
            stack: error.stack
        });
        
        return res.status(500).json({ 
            error: 'Failed to create batch',
            details: error.message
        });
    }
} 