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
    veryIncorrect: Boolean,
    somewhatIncorrect: Boolean,
    incomplete: Boolean,
    citationVeryIncorrect: Boolean,
    citationSomewhatIncorrect: Boolean,
    expertCitationUrl: String
  }
}, { timestamps: true });

// Prevent model recompilation error in development
export const ChatInteraction = mongoose.models.ChatInteraction || mongoose.model('ChatInteraction', ChatInteractionSchema); 