import mongoose from 'mongoose';

const ChatInteractionSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  redactedQuestion: {
    type: String,
    required: true
  },
  aiResponse: String,
  aiService: String,
  referringUrl: String,
  citationUrl: String,
  originalCitationUrl: String,
  confidenceRating: String,
  feedback: String,
  expertFeedback: {
    incomplete: Boolean,
    sentence1Incorrect: Boolean,
    sentence2Incorrect: Boolean,
    sentence3Incorrect: Boolean,
    sentence4Incorrect: Boolean,
    citationIncorrect: Boolean,
    expertCitationUrl: String
  }
}, { timestamps: true });

// Prevent model recompilation error in development
export const ChatInteraction = mongoose.models.ChatInteraction || mongoose.model('ChatInteraction', ChatInteractionSchema); 