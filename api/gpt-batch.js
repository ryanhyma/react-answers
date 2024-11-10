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

        // Create smaller JSONL content
        const jsonlContent = requests.map(request => JSON.stringify({
            messages: [
                // Truncate system prompt if too long
                { role: "system", content: systemPrompt.slice(0, 32000) },
                { role: "user", content: request }
            ],
            model: "gpt-4-turbo-preview",
            max_tokens: 1024  // Reduced from 4096
        })).join('\n');

        // Set response timeout header
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Keep-Alive', 'timeout=60');

        // Upload the file with progress logging
        console.log('Uploading file...');
        const file = await openai.files.create({
            file: Buffer.from(jsonlContent),
            purpose: 'batch'
        });
        console.log('File uploaded:', file.id);

        // Create batch immediately after file upload
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