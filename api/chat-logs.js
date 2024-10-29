// api/chat-logs.js to retrieve logs from the database for evaluation purposes
import dbConnect from '/db-connect';
import ChatLog from '../models/ChatLog';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Get the days parameter from the query, default to 7 days
    const days = parseInt(req.query.days) || 7;
    
    // Calculate the date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await ChatLog.find({
      timestamp: { $gte: startDate }
    })
    .sort({ timestamp: -1 })
    .select('timestamp query response')
    .lean()
    .exec();

    res.status(200).json(logs);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Error fetching chat logs' });
  }
}