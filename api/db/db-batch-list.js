import dbConnect from './db-connect.js';
import { Batch } from '../../models/batch.js';
import { authMiddleware, adminMiddleware } from '../../middleware/auth.js';

export default async function handler(req, res) {


  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  // Verify authentication and admin status
  if (!await authMiddleware(req, res)) return;
  if (!adminMiddleware(req, res)) return;

  try {
    await dbConnect();
    const batches = await Batch.find({}).sort({ createdAt: -1 });
    res.status(200).json(batches);
  } catch (error) {
    console.error('Error retrieving batches:', error);
    res.status(500).json({ message: 'Failed to retrieve batches', error: error.message });
  }
}