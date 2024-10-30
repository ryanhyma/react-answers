// api/chat-logs.js to retrieve logs from the database for evaluation purposes
import dbConnect from './db-connect';
import mongoose from 'mongoose';

// Use the same model as log-interaction.js
let ChatInteraction;
try {
  ChatInteraction = mongoose.model('ChatInteraction');
} catch {
  // This shouldn't be needed since the model is already defined, 
  // but including for safety
  const ChatInteractionSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    originalQuestion: String,
    redactedQuestion: String,
    aiResponse: String,
    aiService: String,
    referringUrl: String,
    citationUrl: String,
    originalCitationUrl: String,
    confidenceRating: String,
    feedback: String,
    expertFeedback: {
      veryIncorrect: Boolean,
      somewhatIncorrect: Boolean,
      incomplete: Boolean,
      citationVeryIncorrect: Boolean,
      citationSomewhatIncorrect: Boolean,
      expertCitationUrl: String
    }
  });
  ChatInteraction = mongoose.model('ChatInteraction', ChatInteractionSchema);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    console.log('DB Connected in chat-logs endpoint');

    const totalCount = await ChatInteraction.countDocuments();
    console.log('Total documents in collection:', totalCount);

    const days = parseInt(req.query.days) || 1;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await ChatInteraction.find({
      timestamp: { $gte: startDate }
    })
    .sort({ timestamp: -1 })
    .lean();

    // Transform the data to match what the frontend expects
    const transformedLogs = logs.map(log => ({
      timestamp: log.timestamp,
      originalQuestion: log.originalQuestion,
      redactedQuestion: log.redactedQuestion,
      aiResponse: log.aiResponse,
      aiService: log.aiService,
      referringUrl: log.referringUrl,
      citationUrl: log.citationUrl,
      originalCitationUrl: log.originalCitationUrl,
      confidenceRating: log.confidenceRating,
      feedback: log.feedback,
      expertFeedback: log.expertFeedback || {
        veryIncorrect: false,
        somewhatIncorrect: false,
        incomplete: false,
        citationVeryIncorrect: false,
        citationSomewhatIncorrect: false,
        expertCitationUrl: ''
      }
    }));

    return res.status(200).json({
      success: true,
      logs: transformedLogs
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch logs',
      details: error.message
    });
  }
}
