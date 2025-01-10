import Anthropic from '@anthropic-ai/sdk';
import fetch from 'node-fetch';
import { Batch } from '../models/batch/batch.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  headers: {
    'anthropic-beta': 'message-batches-2024-09-24'
  }
});

const handleAnthropic = async (batch) => {
  try {
    const results = await anthropic.beta.messages.batches.results(batch.batchId);
    for await (const result of results) {
      const customId = result.custom_id;
      const entryIndex = batch.entries.findIndex(entry => entry.entry_id === customId);
      if (entryIndex !== -1) {
        let updatedEntry = null;
        if (batch.type === 'context') {
          const response = result.result.message.content[0].text;
          const topicMatch = response.match(/<topic>([\s\S]*?)<\/topic>/);
          const topicUrlMatch = response.match(/<topicUrl>([\s\S]*?)<\/topicUrl>/);
          const departmentMatch = response.match(/<department>([\s\S]*?)<\/department>/);
          const departmentUrlMatch = response.match(/<departmentUrl>([\s\S]*?)<\/departmentUrl>/);

          updatedEntry = {
            question: batch.entries[entryIndex].question,
            searchResults: batch.entries[entryIndex].searchResults,
            entry_id: customId,
            topic: topicMatch ? topicMatch[1] : null,
            topicUrl: topicUrlMatch ? topicUrlMatch[1] : null,
            department: departmentMatch ? departmentMatch[1] : null,
            departmentUrl: departmentUrlMatch ? departmentUrlMatch[1] : null,
            context_model: result.result.message.model,
            context_input_tokens: result.result.message.usage.input_tokens,
            context_output_tokens: result.result.message.usage.output_tokens,
            context_cached_creation_input_tokens: result.result.message.usage.cache_creation_input_tokens,
            context_cached_read_input_tokens: result.result.message.usage.cache_read_input_tokens,
          };

        } else {
          const citationHeadRegex = /<citation-head>(.*?)<\/citation-head>/;
          const citationUrlRegex = /<citation-url>(.*?)<\/citation-url>/;
          const confidenceRatingRegex = /<confidence>(.*?)<\/confidence>/;

          const citationHeadMatch = result.result.message.content[0].text.match(citationHeadRegex);
          const citationUrlMatch = result.result.message.content[0].text.match(citationUrlRegex);
          const confidenceRatingMatch = result.result.message.content[0].text.match(confidenceRatingRegex);

          const answer = result.result.message.content[0].text
            .replace(citationHeadRegex, '')
            .replace(citationUrlRegex, '')
            .replace(confidenceRatingRegex, '')
            .trim();

          updatedEntry = {
            ...batch.entries[entryIndex].toJSON(),
            answer_model: result.result.message.model,
            answer: answer,
            answer_input_tokens: result.result.message.usage.input_tokens,
            answer_output_tokens: result.result.message.usage.output_tokens,
            answer_cached_creation_input_tokens: result.result.message.usage.cache_creation_input_tokens,
            answer_cached_read_input_tokens: result.result.message.usage.cache_read_input_tokens,
            answer_citation_head: citationHeadMatch ? citationHeadMatch[1] : null,
            answer_citation_url: citationUrlMatch ? citationUrlMatch[1] : null,
            answer_citation_confidence: confidenceRatingMatch ? confidenceRatingMatch[1] : null,
          };

        }
        batch.entries[entryIndex] = updatedEntry;
      }

    }

    batch.status = 'processed';
    await batch.save();
    return {
      status: "completed",
    };

  } catch (error) {
    console.error('Error checking batch status:', error);
    return res.status(500).json({ error: 'Error checking batch status', details: error.message });
  }
};

const handleOpenAI = async (batchId) => {
  return "";
};


export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { batchId } = req.query;

      if (!batchId) {
        throw new Error('Batch ID is required');
      }
      const batch = await Batch.findOne({ batchId: batchId });
      if (!batch) {
        throw new Error('Batch not found');
      }
      const provider = batch.provider;
      if (!provider) {
        throw new Error('Provider is required');
      }

      let result;
      if (provider === 'anthropic') {
        result = await handleAnthropic(batch);
      } else if (provider === 'openai') {
        result = await handleOpenAI(batch);
      } else {
        throw new Error('Unsupported provider');
      }

      return res.status(200).json(result);

    } catch (error) {
      console.error('Error checking batch status:', error);
      return res.status(500).json({ error: 'Error checking batch status', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}