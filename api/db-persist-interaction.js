import dbConnect from './db-connect.js';
import { ChatInteraction } from '../models/chat.js';
import { Interaction } from '../models/interaction.js';
import { Context } from '../models/context.js';
import { Question } from '../models/question.js';
import { ExpertFeedback } from '../models/expertFeedback.js';
import { Citation } from '../models/citation.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await dbConnect();

    const interactionData = JSON.parse(req.body);

    let chat = await ChatInteraction.findOne({ chatId });

    if (!chat) {
      chat = new ChatInteraction({ chatId: interactionData.chatId, provider: interactionData.aiService, referringUrl: interactionData.referringUrl });
      await chat.save();
    }

    const context = new Context();
    await context.save();

    const question = new Question();
    await question.save();

    const expertFeedback = new ExpertFeedback();
    await expertFeedback.save();

    const citation = new Citation();
    await citation.save();

    const interaction = new Interaction({
      ...interactionData,
      context: context._id,
      question: question._id,
      expertFeedback: expertFeedback._id,
      citation: citation._id,
      chat: chat._id
    });

    await interaction.save();
    await interaction.save();
    res.status(200).json({ message: 'Interaction logged successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to log interaction', error: error.message });
  }
}