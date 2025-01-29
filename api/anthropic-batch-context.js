import Anthropic from '@anthropic-ai/sdk';
import dbConnect from './db-connect.js';
import { getModelConfig } from '../config/ai-models.js';
import { Batch } from '../models/batch.js';
import { Interaction } from '../models/interaction.js';
import { Context } from '../models/context.js';
import { Question } from '../models/question.js';


const modelConfig = getModelConfig('anthropic', 'claude-3-5-haiku-20241022');
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    headers: {
        'anthropic-beta': modelConfig.beta.messageBatches
    }
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    let logString = '';

    try {
        logString += 'Context Batch API request received.\n';
        console.log('Context Batch API request received:', {
            requestCount: req.body.requests?.length
        });

        if (!req.body.requests || !Array.isArray(req.body.requests)) {
            throw new Error('Invalid requests array in payload');
        }

        logString += `Requests count: ${req.body.requests.length}\n`;

        const batch = await anthropic.beta.messages.batches.create({
            requests: req.body.requests.map((request, index) => ({
                custom_id: `batch-${index}`,
                params: {
                    model: modelConfig.name,
                    messages: [{ role: "user", content: request.message }],
                    max_tokens: modelConfig.maxTokens,
                    system: request.systemPrompt + "<searchResults>" + request.searchResults.results + "</searchResults>",
                    temperature: modelConfig.temperature
                }
            }))
        });

        logString += `Context Batch created successfully. Batch ID: ${batch.id}, Status: ${batch.processing_status}\n`;
        console.log('Context Batch created successfully:', {
            batchId: batch.id,
            status: batch.processing_status,
            model: modelConfig.name
        });

        // Save the batch id and entries
        await dbConnect();
        const savedBatch = new Batch({
            batchId: batch.id,
            type: "context",
            provider: "anthropic",
            language: req.body.lang,
            name: req.body.batchName

        });
        await savedBatch.save();
        for (const [index, request] of req.body.requests.entries()) {
            const context = new Context({
                searchProvider: request.searchResults.provider,
                searchResults: JSON.stringify(request.searchResults.results),  // Convert to string as per schema
            });
            await context.save();

            // Create Question document
            const question = new Question({
                redactedQuestion: request.message
            });
            await question.save();

            // Create Interaction with references
            let interaction = new Interaction({
                interactionId: `batch-${index}`,
                question: question._id,  // Store reference to Question
                context: context._id     // Store reference to Context
            });
            await interaction.save();

            // Add interaction reference to batch
            savedBatch.interactions.push(interaction._id);
        }
        await savedBatch.save();

        logString += 'Batch saved successfully to the database.\n';
        console.log('Batch saved:', savedBatch);

        return res.status(200).json({
            batchId: batch.id,
            status: batch.processing_status,
            log: logString
        });

    } catch (error) {
        logString += `Error: ${error.message}\n`;
        console.error('Context Batch API error:', {
            message: error.message,
            type: error.constructor.name,
            stack: error.stack
        });
        return res.status(500).json({
            error: 'Failed to create batch',
            details: error.message,
            log: logString
        });
    }
}