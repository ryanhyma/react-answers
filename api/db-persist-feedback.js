import dbConnect from './db-connect.js';
import { Chat } from '../models/chat.js';
import { ExpertFeedback } from '../models/expert-feedback.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await dbConnect();

    const interaction = req.body;
    let chatId = interaction.chatId;
    let interactionId = interaction.userMessageId;
    const feedback = req.body.feedback;

    let chat = await Chat.findOne({ chatId: chatId });
    let existingInteraction = chat.interactions.find(interaction => interaction.interactionId === interactionId);
    let expertFeedback = new ExpertFeedback();
    existingInteraction.answer.expertFeedback = expertFeedback._id;
    Object.assign(expertFeedback, feedback);
    await expertFeedback.save();
    await existingInteraction.save();

    res.status(200).json({ message: 'Feedback logged successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to log Feedback', error: error.message });
  }
}