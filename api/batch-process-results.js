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
      if (batch.type === 'context') {
        const response = result.result.message.content[0].text;
        const topicMatch = response.match(/<topic>([\s\S]*?)<\/topic>/);
        const topicUrlMatch = response.match(/<topicUrl>([\s\S]*?)<\/topicUrl>/);
        const departmentMatch = response.match(/<department>([\s\S]*?)<\/department>/);
        const departmentUrlMatch = response.match(/<departmentUrl>([\s\S]*?)<\/departmentUrl>/);
        const searchResultsMatch = response.match(/<searchResults>([\s\S]*?)<\/searchResults>/);
        const customId = result.custom_id;


        const entryIndex = batch.entries.findIndex(entry => entry.entry_id === customId);
        if (entryIndex !== -1) {
          let updatedEntry = {
            question: batch.entries[entryIndex].question,
            entry_id: customId,
            topic: topicMatch ? topicMatch[1] : null,
            topicUrl: topicUrlMatch ? topicUrlMatch[1] : null,
            department: departmentMatch ? departmentMatch[1] : null,
            departmentUrl: departmentUrlMatch ? departmentUrlMatch[1] : null,
            searchResults: searchResultsMatch ? searchResultsMatch[1] : null,
          };
          batch.entries[entryIndex] = updatedEntry;
        }

      }
     

    };
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