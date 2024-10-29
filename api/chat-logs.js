// api/chat-logs.js to retrieve logs from the database for evaluation purposes
import dbConnect from './db-connect';
import ChatLog from '../models/ChatLog';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    // Debug: Log the model name and collection
    console.log('Model info:', {
      modelName: ChatLog.modelName,
      collection: ChatLog.collection.name,
      // Check if model is registered
      isRegistered: mongoose.models.ChatLog ? 'yes' : 'no'
    });

    // Try the simplest possible query first
    const count = await ChatLog.countDocuments();
    console.log('Document count:', count);

    // If we get here, basic queries work
    const days = parseInt(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await ChatLog.find()  // Remove filter initially
      .limit(5)
      .lean();

    return res.status(200).json({
      success: true,
      count,
      logs
    });

  } catch (error) {
    console.error('API Error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({
      error: 'Failed to fetch logs',
      details: error.message
    });
  }
}