// server/server.js

const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Add this logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} request to ${req.url}`);
  next();
});

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
    const { message, systemPrompt } = req.body;
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      system: systemPrompt,
      messages: [{ role: "user", content: message }],
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