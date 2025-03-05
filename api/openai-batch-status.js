import { AzureOpenAI } from 'openai';

const openai = new AzureOpenAI({
    azureApiKey: process.env.AZURE_OPENAI_API_KEY,  // Azure API Key
    azureEndpoint: process.env.AZURE_OPENAI_ENDPOINT, // Azure endpoint
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-06-01'
});

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { batchId } = req.query;
        const batch = await openai.batches.retrieve(batchId);

        // Check if the batch is completed and has output
        const isCompleted = batch.status === 'completed';
        if (isCompleted) {
            return res.status(200).json({
                status: "completed",
            });
        } else {
            return res.status(200).json({
                status: "processing",
            });
        }
    } catch (error) {
        console.error('Azure OpenAI Batch status error:', error);
        return res.status(500).json({ error: 'Failed to get batch status' });
    }
} 