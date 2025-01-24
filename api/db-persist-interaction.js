import dbConnect from './db-connect.js';
import { Chat } from '../models/chat.js';
import { Interaction } from '../models/interaction.js';
import { Context } from '../models/context.js';
import { Question } from '../models/question.js';
import { Citation } from '../models/citation.js';
import { Answer } from '../models/answer.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await dbConnect();

    const interaction = req.body;
    let chatId = interaction.chatId;
    let chat = await Chat.findOne({ chatId: chatId });

    if (!chat) {
      chat = new Chat();
    }
    chat.chatId = interaction.chatId;
    chat.provider = interaction.aiService;
    chat.referringUrl = interaction.referringUrl;
    
    const dbInteraction = new Interaction();
    await dbInteraction.save();
    chat.interaction = dbInteraction._id;

    const context = new Context();
    Object.assign(context, interaction.context);
    await context.save();
    dbInteraction.context = context._id;

    const answer = new Answer();
    Object.assign(answer, interaction.answer);
    await answer.save();
    dbInteraction.answer = answer._id;

    const citation = new Citation();
    citation.aiCitationUrl = interaction.originalCitationUrl;
    citation.providerCitationUrl = interaction.finalCitationUrl;
    citation.confidenceRating = interaction.confidenceRating;
    await citation.save();
    answer.citation = citation._id;
    // TODO citation head?

    const question = new Question();
    question.redactedQuestion = interaction.question;
    await question.save();
    dbInteraction.question = question._id;

    await dbInteraction.save();
    await chat.save();



    res.status(200).json({ message: 'Interaction logged successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to log interaction', error: error.message });
  }
}