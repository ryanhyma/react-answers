import { Batch } from '../models/batch/batch.js';
import { AzureOpenAI } from 'openai';

const openai = new AzureOpenAI({
    azureApiKey: process.env.AZURE_OPENAI_API_KEY,  // Azure API Key
    azureEndpoint: process.env.AZURE_OPENAI_ENDPOINT, // Azure endpoint
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-06-01'
});

const handleOpenAI = async (batch) => {
  try {
    const result = await openai.batches.retrieve(batch.batchId);
    const fileId = result.error_file_id || result.output_file_id;
    if (!fileId) {
      throw new Error('No file ID found in the batch result');
    }
    const results = await retrieveJsonlAsJson(fileId);

    for await (const result of results) {
      const customId = result.custom_id;
      const entryIndex = batch.entries.findIndex(entry => entry.entry_id === customId);
      if (entryIndex !== -1) {
        let updatedEntry = null;
        if (batch.type === 'context') {
          const response = result.response.body.choices[0].message.content;
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
            context_model: result.response.body.model,
            context_input_tokens: result.response.body.usage.prompt_tokens,
            context_output_tokens: result.response.body.usage.completion_tokens,
            context_cached_creation_input_tokens: "",
            context_cached_read_input_tokens: "",
          };

        } else {
          const citationHeadRegex = /<citation-head>(.*?)<\/citation-head>/;
          const citationUrlRegex = /<citation-url>(.*?)<\/citation-url>/;
          const confidenceRatingRegex = /<confidence>(.*?)<\/confidence>/;

          const citationHeadMatch = result.response.body.choices[0].message.content.match(citationHeadRegex);
          const citationUrlMatch = result.response.body.choices[0].message.content.match(citationUrlRegex);
          const confidenceRatingMatch = result.response.body.choices[0].message.content.match(confidenceRatingRegex);

          const answer = result.response.body.choices[0].message.content
            .replace(citationHeadRegex, '')
            .replace(citationUrlRegex, '')
            .replace(confidenceRatingRegex, '')
            .trim();

          updatedEntry = {
            ...batch.entries[entryIndex].toJSON(),
            answer_model: result.response.body.model,
            answer: answer,
            answer_input_tokens: result.response.body.usage.prompt_tokens,
            answer_output_tokens: result.response.body.usage.completion_tokens,
            answer_cached_creation_input_tokens: "",
            answer_cached_read_input_tokens: "",
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

async function retrieveJsonlAsJson(fileId) {
  try {
      // Get the file content as a stream
      const response = await openai.files.content(fileId);
      const contentStream = response.body;

      // Collect chunks of the stream
      const chunks = [];
      for await (const chunk of contentStream) {
          chunks.push(chunk);
      }

      // Combine chunks into a single string
      const jsonlContent = Buffer.concat(chunks).toString('utf-8');

      // Convert JSONL into an array of JSON objects
      const jsonArray = jsonlContent
          .split('\n')                // Split by lines
          .filter(line => line.trim()) // Remove empty lines
          .map(line => JSON.parse(line)); // Parse each line as JSON

      console.log('Parsed JSON Array:', jsonArray);

      return jsonArray;
  } catch (error) {
      console.error('Error processing JSONL:', error.message);
      if (error.response?.data) {
          console.error('Response details:', error.response.data);
      }
  }
}




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

      let result = await handleOpenAI(batch);


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