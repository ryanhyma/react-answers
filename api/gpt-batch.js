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
        
        // Create JSONL content
        const jsonlRequests = requests.map((request, index) => ({
            custom_id: `request-${index}`,
            method: "POST",
            url: "/v1/chat/completions",
            body: {
                model: "gpt-4o",  // or "gpt-4-turbo-preview"
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: request
                    }
                ],
                max_tokens: 1024,
                temperature: 0.5
            }
        }));

        // Convert to JSONL format
        const jsonlContent = jsonlRequests
            .map(req => JSON.stringify(req))
            .join('\n');

        // Create file for batch
        const file = await openai.files.create({
            file: Buffer.from(jsonlContent),
            purpose: 'batch'
        });
        console.log('File created with ID:', file.id);

        // Create the batch using the file
        const batch = await openai.batches.create({
            input_file_id: file.id,
            endpoint: "/v1/chat/completions"
        });
        console.log('Batch created with ID:', batch.id);

        return res.status(200).json({ batchId: batch.id });
    } catch (error) {
        console.error('GPT Batch creation error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            headers: error.response?.headers,
            stack: error.stack
        });
        return res.status(500).json({ 
            error: error.message,
            details: error.response?.data || 'No additional details available'
        });
    }
} 