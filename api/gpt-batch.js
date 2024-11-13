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
        
        console.log('Payload sizes:', {
            systemPromptSize: Buffer.byteLength(systemPrompt, 'utf8') / 1024 / 1024, // Size in MB
            requestsSize: Buffer.byteLength(JSON.stringify(requests), 'utf8') / 1024 / 1024,
            totalRequests: requests.length
        });

        const truncatedSystemPrompt = systemPrompt.slice(0, 4000); // Much smaller limit

        const jsonlContent = requests.map((request, index) => {
            const entry = {
                custom_id: `request-${index}`,
                method: "POST",
                url: "/v1/chat/completions",
                body: {
                    model: "gpt-4-turbo-preview",
                    messages: [
                        { role: "system", content: truncatedSystemPrompt },
                        { role: "user", content: request.slice(0, 2000) }
                    ],
                    max_tokens: 1024,
                    temperature: 0.5
                }
            };
            
            const entrySize = Buffer.byteLength(JSON.stringify(entry), 'utf8');
            console.log(`Entry size: ${entrySize / 1024}KB`);
            
            return JSON.stringify(entry);
        }).join('\n');

        const totalSize = Buffer.byteLength(jsonlContent, 'utf8');
        console.log(`Total JSONL size: ${totalSize / 1024 / 1024}MB`);

        const file = await openai.files.create({
            file: Buffer.from(jsonlContent),
            purpose: 'batch',
            content_type: 'application/jsonl'
        });

        console.log('File uploaded:', file.id);

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
            stack: error.stack,
            size: error.size // Log size if available
        });
        
        return res.status(500).json({ 
            error: 'Failed to create batch',
            details: error.message
        });
    }
} 