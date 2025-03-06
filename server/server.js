// server/server.js - this is only used for local development NOT for Vercel
import express from 'express';
import cors from 'cors';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import openAIHandler from '../api/openai-message.js';
import azureHandler from '../api/azure-message.js';
import anthropicAgentHandler from '../api/anthropic-message.js';
import dbChatLogsHandler from '../api/db-chat-logs.js';
import anthropicBatchHandler from '../api/anthropic-batch.js';
import openAIBatchHandler from '../api/openai-batch.js';
import anthropicBatchStatusHandler from '../api/anthropic-batch-status.js';
import openAIBatchStatusHandler from '../api/openai-batch-status.js';
import contextSearchHandler from '../api/search-context.js';
import anthropicBatchContextHandler from '../api/anthropic-batch-context.js';
import openAIBatchContextHandler from '../api/openai-batch-context.js';
import dbBatchListHandler from '../api/db-batch-list.js';
import anthropicBatchProcessResultsHandler from '../api/anthropic-batch-process-results.js';
import openAIBatchProcessResultsHandler from '../api/openai-batch-process-results.js';
import dbBatchRetrieveHandler from '../api/db-batch-retrieve.js';
import anthropicBatchCancelHandler from '../api/anthropic-batch-cancel.js';
import openAIBatchCancelHandler from '../api/openai-batch-cancel.js';
import anthropicContextAgentHandler from '../api/anthropic-context.js';
import openAIContextAgentHandler from '../api/openai-context.js';
import dbChatSessionHandler from '../api/db-chat-session.js';
import dbVerifyChatSessionHandler from '../api/db-verify-chat-session.js';
import dbCheckhandler from '../api/db-check.js';
import dbPersistInteraction from '../api/db-persist-interaction.js';
import dbPersistFeedback from '../api/db-persist-feedback.js';
import dbLogHandler from '../api/db-log.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../build')));
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api')) {
    next();
    return;
  }
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});


app.post('/api/db-persist-feedback', dbPersistFeedback);
app.post('/api/db-persist-interaction', dbPersistInteraction);
app.get('/api/db-chat-session', dbChatSessionHandler);
app.get('/api/db-verify-chat-session', dbVerifyChatSessionHandler);
app.post("/api/openai-message", openAIHandler);
app.post("/api/azure-message", azureHandler);
app.post('/api/anthropic-message', anthropicAgentHandler);
app.post('/api/anthropic-context', anthropicContextAgentHandler);
app.post('/api/openai-context', openAIContextAgentHandler);
app.get('/api/db-chat-logs', dbChatLogsHandler);
app.post('/api/anthropic-batch', anthropicBatchHandler);
app.post('/api/openai-batch', openAIBatchHandler);
app.get('/api/anthropic-batch-status', anthropicBatchStatusHandler);
app.get('/api/openai-batch-status', openAIBatchStatusHandler);
app.post('/api/search-context', contextSearchHandler);
app.post('/api/anthropic-batch-context', anthropicBatchContextHandler);
app.get('/api/anthropic-batch-cancel', anthropicBatchCancelHandler);
app.get('/api/openai-batch-cancel', openAIBatchCancelHandler);
app.post('/api/openai-batch-context', openAIBatchContextHandler);
app.get('/api/db-batch-list', dbBatchListHandler);
app.get('/api/anthropic-batch-status', anthropicBatchStatusHandler);
app.get('/api/anthropic-batch-process-results', anthropicBatchProcessResultsHandler);
app.get('/api/openai-batch-process-results', openAIBatchProcessResultsHandler);
app.get('/api/db-batch-retrieve', dbBatchRetrieveHandler);
app.get('/api/db-check', dbCheckhandler);
app.get('/api/db-log', dbLogHandler);
app.post('/api/db-log', dbLogHandler);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Healthy' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));