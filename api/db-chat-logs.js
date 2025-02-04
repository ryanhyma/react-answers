// api/chat-logs.js to retrieve logs from the database for evaluation purposes
import dbConnect from './db-connect.js';
import { Chat } from '../models/chat.js';



export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    console.log('DB Connected in chat-logs endpoint');

    const totalCount = await Chat.countDocuments();
    console.log('Total documents in collection:', totalCount);

    const days = parseInt(req.query.days) || 1;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const chats = await Chat.find({
      createdAt: { $gte: startDate }
    })
      .populate({
        path: 'interactions',
        populate: [
          { path: 'context'},
          { path: 'expertFeedback' },
          { path: 'question' },
          {
            path: 'answer',
            populate: [
              { path: 'sentences' },
              { path: 'citation' }
            ]
          }
        ]
      })
      .sort({ createdAt: -1 });

    const transformOptions = { virtuals: true, versionKey: false };
    
    const transformDoc = (doc) => {
      if (!doc) return doc;
      const transformed = doc.toJSON ? doc.toJSON(transformOptions) : doc;
      
      Object.keys(transformed).forEach(key => {
        if (Array.isArray(transformed[key])) {
          transformed[key] = transformed[key].map(item => transformDoc(item));
        } else if (transformed[key] && typeof transformed[key] === 'object') {
          transformed[key] = transformDoc(transformed[key]);
        }
      });
      
      return transformed;
    };

    return res.status(200).json({
      success: true,
      logs: chats.map(doc => transformDoc(doc))
    });


  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch logs',
      details: error.message
    });
  }
}
