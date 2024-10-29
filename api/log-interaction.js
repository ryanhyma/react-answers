import dbConnect from './db-connect';
import mongoose from 'mongoose';

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
  expertRating: {
    rating: String,
    expertCitationURL: String
  }
});

let ChatInteraction;
try {
  ChatInteraction = mongoose.model('ChatInteraction');
} catch {
  ChatInteraction = mongoose.model('ChatInteraction', ChatInteractionSchema);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await dbConnect();
    const interaction = new ChatInteraction(req.body);
    await interaction.save();
    res.status(200).json({ message: 'Interaction logged successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to log interaction', error: error.message });
  }
}