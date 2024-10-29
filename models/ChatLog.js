// server/models/ChatLog.js
import mongoose from 'mongoose';

const chatLogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  query: {
    type: String,
    required: true
  },
  response: {
    type: String,
    required: true
  }
});

// Prevent mongoose from creating a new model if it already exists
export default mongoose.models.ChatLog || mongoose.model('ChatLog', chatLogSchema);