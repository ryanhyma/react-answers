// api/chat-logs.js to retrieve logs from the database for evaluation purposes
import dbConnect from './db-connect.js';
import { ChatInteraction } from '../models/chat/interaction.js';

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
      aiService: log.aiService,
      redactedQuestion: log.redactedQuestion,
      referringUrl: log.referringUrl,
      preliminaryChecks: log.preliminaryChecks,
      aiResponse: log.aiResponse,
      englishAnswer: log.englishAnswer,
      answer: log.answer,
      originalCitationUrl: log.originalCitationUrl,
      citationUrl: log.citationUrl,
      confidenceRating: log.confidenceRating,
      feedback: log.feedback,
      expertFeedback: log.expertFeedback || {
        totalScore: null,
        sentence1Score: null,
        sentence2Score: null,
        sentence3Score: null,
        sentence4Score: null,
        citationScore: null,
        answerImprovement: '',
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
