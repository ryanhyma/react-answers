// server/server.js
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Get MongoDB URI based on environment
const getMongoURI = () => {
  // In development, use the REACT_APP prefixed version
  if (process.env.REACT_APP_ENV === 'development') {
    return process.env.REACT_APP_MONGODB_URI;
  }
  // In production (Vercel), use the non-prefixed version
  return process.env.MONGODB_URI;
};

mongoose.connect(getMongoURI())
  .then(() => {
    console.log('MongoDB connected successfully');
    console.log(`Running in ${process.env.REACT_APP_ENV || 'production'} mode`);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

// Chat Log Model
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

const ChatLog = mongoose.models.ChatLog || mongoose.model('ChatLog', chatLogSchema);

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} request to ${req.url}`);
  next();
});

// Environment-aware logging
if (process.env.REACT_APP_ENV === 'development') {
  console.log('Development environment variables:');
  console.log('REACT_APP_OPENAI_API_KEY:', process.env.REACT_APP_OPENAI_API_KEY ? 'Set' : 'Not Set');
  console.log('REACT_APP_ANTHROPIC_API_KEY:', process.env.REACT_APP_ANTHROPIC_API_KEY ? 'Set' : 'Not Set');
  console.log('REACT_APP_MONGODB_URI:', process.env.REACT_APP_MONGODB_URI ? 'Set' : 'Not Set');
} else {
  console.log('Running in production mode');
}

// Rest of your endpoints...
// New Chat Logs endpoint
app.get('/api/chat-logs', async (req, res) => {
  console.log('Received request to /api/chat-logs');
  try {
    const days = parseInt(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await ChatLog.find({
      timestamp: { $gte: startDate }
    })
    .sort({ timestamp: -1 })
    .select('timestamp query response')
    .lean()
    .exec();

    console.log(`Found ${logs.length} logs from the past ${days} days`);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching chat logs:', error);
    res.status(500).json({ error: 'Error fetching chat logs' });
  }
});

// Your existing Claude and ChatGPT endpoints...

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));