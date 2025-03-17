import { Batch } from '../../models/batch.js';
import dbConnect from '../../api/db/db-connect.js';
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

  const { batchId } = req.query;
  try {

    if (!batchId) {
      return res.status(400).json({ error: 'Batch ID is required' });
    }
    await dbConnect();
    await Batch.findOneAndDelete({ batchId });
    const batch = await openai.batches.cancel(batchId);
    return res.status(200).json({
      message: 'Cancellation initiated',
      note: 'Cancellation may not take immediate effect'
    });
  } catch (error) {
    await Batch.findOneAndDelete({ batchId });
    console.error('Error canceling batch:', error);
    return res.status(500).json({
      error: 'Failed to cancel batch',
      details: error.message
    });
  }
}