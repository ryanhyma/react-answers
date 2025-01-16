import mongoose from 'mongoose';

const ChatInteractionSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  aiService: String,
  redactedQuestion: {
    type: String,
    required: true
  },
  referringUrl: String,
  preliminaryChecks: String,
  aiResponse: String,
  englishAnswer: String,
  answer: String,
  originalCitationUrl: String,
  citationUrl: String,
  confidenceRating: String,
  feedback: String,
  expertFeedback: {
    totalScore: Number,
    sentence1Score: Number,
    sentence2Score: Number,
    sentence3Score: Number,
    sentence4Score: Number,
    citationScore: Number,
    answerImprovement: String,
    expertCitationUrl: String
  }
}, { timestamps: true });

// Prevent model recompilation error in development
export const ChatInteraction = mongoose.models.ChatInteraction || mongoose.model('ChatInteraction', ChatInteractionSchema); 