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
    console.log('DB Connected in chat-logs endpoint');

    // First get a count
    const totalCount = await ChatLog.countDocuments();
    console.log('Total documents in collection:', totalCount);

    // Get some sample data without any filtering
    const sampleLogs = await ChatLog.find()
      .limit(5)
      .lean();

    console.log('Sample log structure:', 
      sampleLogs.length > 0 ? 
      Object.keys(sampleLogs[0]) : 
      'No logs found'
    );

    return res.status(200).json({
      success: true,
      totalCount,
      logs: sampleLogs,
      message: 'Query completed successfully'
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch logs',
      details: error.message
    });
  }
}