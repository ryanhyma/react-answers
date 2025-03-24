import dbConnect from './db-connect.js';
import { Interaction } from '../../models/interaction.js';
import EmbeddingService from '../../services/EmbeddingService.js';
import config from '../../config/eval.js';

async function generateEmbeddingsHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Process interactions for the specified duration
    const duration = config.embedBatchProcessingDuration;
    const result = await EmbeddingService.processEmbeddingForDuration(duration);
    
    
    return res.status(200).json({
      completed: result.completed,
      total: result.total,
      remaining: result.remaining,
      duration: result.duration
    });
  } catch (error) {
    console.error('Error generating embeddings:', error);
    return res.status(500).json({ error: 'Failed to generate embeddings', details: error.message });
  }
}

export default generateEmbeddingsHandler;