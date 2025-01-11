import OpenAI from 'openai';
import { getModelConfig } from '../config/ai-models.js';
import fs from 'fs';
import dbConnect from './db-connect.js';
import { Batch } from '../models/batch/batch.js';


const modelConfig = getModelConfig('openai', 'gpt-4o-mini');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('Context Batch API request received:', {
            requestCount: req.body.requests?.length
        });

        if (!req.body.requests || !Array.isArray(req.body.requests)) {
            throw new Error('Invalid requests array in payload');
        }

        const jsonlRequests = req.body.requests.map((request, index) => ({
            custom_id: `eval-${index}`,
            method: "POST",
            url: "/v1/chat/completions",
            body: {
                model: modelConfig.name,
                messages: [
                    {
                        role: "system",
                        content: request.systemPrompt + request.searchResults,
                    },
                    {
                        role: "user",
                        content: request.message
                    }
                ],
                max_tokens: modelConfig.maxTokens,
                temperature: modelConfig.temperature
            }
        }));

        // Convert to JSONL format
        let jsonlContent = jsonlRequests
            .map(req => JSON.stringify(req))
            .join('\n');

        // Log the size of the JSONL content
        console.log('Size of JSONL content:', Buffer.byteLength(jsonlContent, 'utf8'), 'bytes');

        // Define the path for the temporary JSONL file
        // TODO - Why does this work vs a buffered stream??
        const jsonlFilePath = './temp.jsonl';

        // Write the JSONL content to the file
        fs.writeFileSync(jsonlFilePath, jsonlContent);

        // Create a readable stream from the file
        const jsonlStream = fs.createReadStream(jsonlFilePath);

        // Create file for batch
        const file = await openai.files.create({
            file: jsonlStream,
            purpose: 'batch'
        });
        console.log('File created with ID:', file.id);

        // Create the batch using the file
        const batch = await openai.batches.create({
            input_file_id: file.id,
            endpoint: "/v1/chat/completions",
            completion_window: "24h"
        });
        console.log('Batch created with ID:', batch.id);



        console.log('Context Batch created successfully:', {
            batchId: batch.id,
            status: batch.processing_status,
            model: modelConfig.name
        });

        // save the batch id and entries
        await dbConnect();
        const savedBatch = new Batch({
            batchId: batch.id,
            type: "context",
            provider: "openai",
            entries: req.body.requests.map((request, index) => ({
                entry_id: `eval-${index}`,
                question: request.message,
                searchResults: request.searchResults,
            }))
        });
        await savedBatch.save();

        console.log('Batch saved:', savedBatch);
        return res.status(200).json({
            batchId: batch.id,
            status: batch.processing_status
        });

    } catch (error) {
        console.error('Context Batch API error:', {
            message: error.message,
            type: error.constructor.name,
            stack: error.stack
        });
        return res.status(500).json({
            error: 'Failed to create batch',
            details: error.message
        });
    }
} 