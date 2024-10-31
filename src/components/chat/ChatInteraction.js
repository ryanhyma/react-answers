import mongoose from 'mongoose';

const chatInteractionSchema = new mongoose.Schema({
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
}, { timestamps: true });
const ChatInteraction = mongoose.model('ChatInteraction', chatInteractionSchema);

export default ChatInteraction;