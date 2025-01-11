// server/server.js - this is only used for local development NOT for Vercel
import express from 'express';
import cors from 'cors';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import openAIHandler from '../api/openai.js';
import contextAgentHandler from '../api/context-agent.js';
import anthropicAgentHandler from '../api/anthropic.js';
import dbChatLogsHandler from '../api/db-chat-logs.js';
import anthropicBatchHandler from '../api/anthropic-batch.js';
import openAIBatchHandler from '../api/openai-batch.js';
import anthropicBatchStatusHandler from '../api/anthropic-batch-status.js';
import openAIBatchStatusHandler from '../api/openai-batch-status.js';
import contextSearchHandler from '../api/context-search.js';
import anthropicBatchContextHandler from '../api/anthropic-batch-context.js';
import openAIBatchContextHandler from '../api/openai-batch.js';
import dbBatchListHandler from '../api/db-batch-list.js';
import anthropicBatchProcessResultsHandler from '../api/anthropic-batch-process-results.js';
import openAIBatchProcessResultsHandler from '../api/openai-batch-process-results.js';
import dbBatchRetrieveHandler from '../api/db-batch-retrieve.js';

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

app.post("/api/openai", openAIHandler);

app.post('/api/anthropic', anthropicAgentHandler);

// Use the context-agent handler for local development
app.post('/api/context-agent', contextAgentHandler);

app.get('/api/db-chat-logs', dbChatLogsHandler);

app.post('/api/anthropic-batch', anthropicBatchHandler);

app.post('/api/openai-batch', openAIBatchHandler);

app.get('/api/anthropic-batch-status', anthropicBatchStatusHandler);

app.get('/api/openai-batch-status', openAIBatchStatusHandler);

app.post('/api/context-search', contextSearchHandler);

app.post('/api/anthropic-batch-context', anthropicBatchContextHandler);

app.post('/api/openai-batch-context', openAIBatchContextHandler);

app.get('/api/db-batch-list', dbBatchListHandler);

app.get('/api/anthropic-batch-status', anthropicBatchStatusHandler);

app.get('/api/anthropic-batch-process-results', anthropicBatchProcessResultsHandler);

app.get('/api/openai-batch-process-results', openAIBatchProcessResultsHandler);

app.get('/api/db-batch-retrieve', dbBatchRetrieveHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));