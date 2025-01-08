// server/server.js - this is only used for local development NOT for Vercel
import express from 'express';
import cors from 'cors';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import coherePkg from 'cohere-ai';

import chatGPTHandler from '../api/chatgpt.js';
import contextAgentHandler from '../api/context-agent.js';
import claudeAgentHandler from '../api/claude.js';
import chatLogsHandler from '../api/chat-logs.js';
import batchClaudeHandler from '../api/claude-batch.js';
import batchChatGPTHandler from '../api/gpt-batch.js';
import batchClaudeCancelHandler from '../api/claude-batch-cancel.js';
import batchChatGPTCancelHandler from '../api/gpt-batch-cancel.js';
import batchClaudeStatusHandler from '../api/claude-batch-status.js';
import batchChatGPTStatusHandler from '../api/gpt-batch-status.js';
import contextSearchHandler from '../api/context-search.js';
import claudBatchContextHandler from '../api/claude-batch-context.js';
import chatGPTBatchContextHandler from '../api/gpt-batch.js';
import batchListHandler from '../api/batch-list.js';
import batchStatusHandler from '../api/batch-status.js';
import batchProcessResultsHandler from '../api/batch-process-results.js';
import batchRetrieveHandler from '../api/batch-retrieve.js';
import { chat } from 'googleapis/build/src/apis/chat/index.js';

const { CohereClient } = coherePkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));


mongoose.connect(process.env.MONGODB_URI)
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
  console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set' : 'Not Set');
  console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'Set' : 'Not Set');
  console.log('COHERE_API_KEY:', process.env.COHERE_API_KEY ? 'Set' : 'Not Set');
  console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not Set');
} else {
  console.log('Running in production mode');
}


const cohere = null;
//const cohere = new CohereClient({
//  token: process.env.REACT_APP_COHERE_API_KEY
//});

app.post("/api/chatgpt",chatGPTHandler);

app.post('/api/claude', claudeAgentHandler);

// Use the context-agent handler for local development
app.post('/api/context-agent', contextAgentHandler);

app.get('/api/chat-logs', chatLogsHandler);

app.post('/api/claude-batch', batchClaudeHandler);

app.post('/api/chatgpt-batch', batchChatGPTHandler);

app.post('/api/claude-batch-cancel', batchClaudeCancelHandler);

app.post('/api/chatgpt-batch-cancel', batchChatGPTCancelHandler);

app.get('/api/claude-batch-status', batchClaudeStatusHandler);

app.get('/api/chatgpt-batch-status', batchChatGPTStatusHandler);

app.post('/api/context-search', contextSearchHandler);

app.post('/api/claude-batch-context', claudBatchContextHandler);

app.post('/api/chatgpt-batch-context', chatGPTBatchContextHandler);

app.get('/api/batch-list',batchListHandler);

app.get('/api/batch-status',batchStatusHandler);

app.get('/api/batch-process-results',batchProcessResultsHandler);

app.get('/api/batch-retrieve', batchRetrieveHandler);


// server.js - update the Cohere endpoint
app.post('/api/cohere', async (req, res) => {
  console.log('Received request to /api/cohere');
  console.log('Request body:', req.body);
  try {
    const { messages } = req.body;
    
    // Get the latest message (user's input)
    const userMessage = messages[messages.length - 1].content;
    
    // Format chat history for Cohere
    const chat_history = messages.slice(0, -1).map(msg => ({
      role: msg.role.toUpperCase(),
      message: msg.content
    }));

    console.log('Calling Cohere with:', {
      message: userMessage,
      historyLength: chat_history.length
    });

    const response = await cohere.chat({
      model: "command-r-plus-08-2024",
      message: userMessage,  // The current message
      chat_history: chat_history,  // Previous messages
      temperature: 0.5
    });

    console.log('Cohere API response received');
    res.json({ content: response.text });
  } catch (error) {
    console.error('Error calling Cohere API:', {
      message: error.message,
      details: error
    });
    res.status(500).json({ 
      error: 'Error processing your request',
      details: error.message 
    });
  }
});

app.post('/api/haiku', async (req, res) => {
  console.log('Received request to /api/haiku');
  console.log('Request body:', req.body);
  try {
    const { message, systemPrompt } = req.body;

    // Log the current message and system prompt length
    console.log('Current Message:', message);
    console.log('System Prompt Length:', systemPrompt?.length);

    const messages = [
      { role: "user", content: message }
    ];

    // Log the messages being sent to the Haiku model
    console.log('Messages being sent to Haiku:', JSON.stringify(messages, null, 2));

    const response = await anthropic.beta.promptCaching.messages.create({
      model: "claude-3-5-haiku-20241022",
      system: [{
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral" }
      }],
      messages: messages,
      max_tokens: 1024
    });

    console.log('Haiku API response received');
    res.json({ content: response.content[0].text });
  } catch (error) {
    console.error('Error calling Haiku API:', error);
    res.status(500).json({ error: 'Error processing your request' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));