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
app.use(express.json({ limit: '10mb' }));

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

console.log('Environment variables:');
console.log('REACT_APP_OPENAI_API_KEY:', process.env.REACT_APP_OPENAI_API_KEY ? 'Set' : 'Not Set');
console.log('REACT_APP_ANTHROPIC_API_KEY:', process.env.REACT_APP_ANTHROPIC_API_KEY ? 'Set' : 'Not Set');

const anthropic = new Anthropic({
  apiKey: process.env.REACT_APP_ANTHROPIC_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
});

app.post('/api/claude', async (req, res) => {
  console.log('Received request to /api/claude');
  console.log('Request body:', req.body);
  try {
    const { message, systemPrompt, conversationHistory } = req.body;
    
    // Log conversation details
    console.log('Conversation History:', JSON.stringify(conversationHistory, null, 2));
    console.log('Current Message:', message);
    console.log('System Prompt Length:', systemPrompt?.length);

    // Convert conversation history to Claude's format and add current message
    const messages = [
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: "user", content: message }
    ];

    // Log the final messages array being sent to Claude
    console.log('Messages being sent to Claude:', JSON.stringify(messages, null, 2));

    const response = await anthropic.beta.promptCaching.messages.create({
      model: "claude-3-5-sonnet-20240620",
      system: [{
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral" }
      }],
      messages: messages,
      max_tokens: 1024
    });

    console.log('Claude API response received');
    res.json({ content: response.content[0].text });
  } catch (error) {
    console.error('Error calling Claude API:', error);
    res.status(500).json({ error: 'Error processing your request' });
  }
});
app.post('/api/chatgpt', async (req, res) => {
  console.log('Received request to /api/chatgpt');
  console.log('Request body:', req.body);
  try {
    const { message, systemPrompt } = req.body;
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 1024,
    });
    console.log('ChatGPT API response received');
    res.json({ content: response.choices[0].message.content });
  } catch (error) {
    console.error('Error calling ChatGPT API:', error);
    res.status(500).json({ error: 'Error processing your request' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));