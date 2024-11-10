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
        
        // Return the full batch object structure
        return res.status(200).json({
            id: batch.id,
            object: batch.object, // Will be "batch"
            endpoint: batch.endpoint,
            errors: batch.errors,
            input_file_id: batch.input_file_id,
            completion_window: batch.completion_window,
            status: batch.status,
            output_file_id: batch.output_file_id,
            error_file_id: batch.error_file_id,
            created_at: batch.created_at,
            in_progress_at: batch.in_progress_at,
            expires_at: batch.expires_at,
            finalizing_at: batch.finalizing_at,
            completed_at: batch.completed_at,
            failed_at: batch.failed_at,
            expired_at: batch.expired_at,
            cancelling_at: batch.cancelling_at,
            cancelled_at: batch.cancelled_at,
            request_counts: batch.request_counts,
            metadata: batch.metadata
        });
    } catch (error) {
        console.error('GPT Batch status error:', error);
        return res.status(500).json({ error: 'Failed to get batch status' });
    }
} 