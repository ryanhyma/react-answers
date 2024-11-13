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
        const batch = await openai.batches.retrieve(batchId);
        
        // Check if the batch is completed and has output
        const isCompleted = batch.status === 'completed';
        const hasOutput = batch.output_file_id != null;

        // Return a more focused response with just the essential status info
        return res.status(200).json({
            status: batch.status,
            isCompleted,
            hasOutput,
            output_file_id: batch.output_file_id,
            error_file_id: batch.error_file_id
        });
    } catch (error) {
        console.error('GPT Batch status error:', error);
        return res.status(500).json({ error: 'Failed to get batch status' });
    }
} 