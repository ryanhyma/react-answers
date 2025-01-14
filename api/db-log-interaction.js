import dbConnect from './db-connect.js';
import { ChatInteraction } from '../models/chat/interaction.js';

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