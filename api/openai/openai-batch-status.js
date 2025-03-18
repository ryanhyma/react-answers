import { createDirectOpenAIClient } from '../../agents/AgentService.js';
import { authMiddleware, adminMiddleware } from '../../middleware/auth.js';

const openai = createDirectOpenAIClient();

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Verify authentication and admin status
    if (!await authMiddleware(req, res)) return;
    if (!await adminMiddleware(req, res)) return;

    try {
        const { batchId } = req.query;
        const batch = await openai.batches.retrieve(batchId);

        // Check if the batch is completed and has output
        return res.status(200).json({
            status: batch.status,
        });
    } catch (error) {
        return res.status(200).json({
            status: "not_found",
        });
    }
}