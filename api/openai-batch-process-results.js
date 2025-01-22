import { Batch } from '../models/batch/batch.js';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const handleOpenAI = async (batch) => {
  try {
    const result = await openai.batches.retrieve(batch.batchId);
    const fileId = result.error_file_id || result.output_file_id;
    if (!fileId) {
      throw new Error('No file ID found in the batch result');
    }

    const contentStream = (await openai.files.content(fileId)).body;
    const decoder = new TextDecoder();
    let buffer = '';

    for await (const chunk of contentStream) {
      // Decode chunk to string
      const text = decoder.decode(chunk, { stream: true });
      buffer += text;

      while (true) {
        // Split on newlines
        let lines = buffer.split('\n');
        buffer = lines.pop() ?? ''; // Retain incomplete line

        for (const line of lines) {
          if (!line.trim()) continue; // Skip empty lines

          const result = JSON.parse(line.trim());
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
                context_cached_creation_input_tokens: '',
                context_cached_read_input_tokens: '',
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
                answer_cached_creation_input_tokens: '',
                answer_cached_read_input_tokens: '',
                answer_citation_head: citationHeadMatch ? citationHeadMatch[1] : null,
                answer_citation_url: citationUrlMatch ? citationUrlMatch[1] : null,
                answer_citation_confidence: confidenceRatingMatch ? confidenceRatingMatch[1] : null,
              };
            }

            // Update the batch entry
            batch.entries[entryIndex] = updatedEntry;

            // Save the updated entry individually
            await Batch.updateOne(
              { batchId: batch.batchId, 'entries.entry_id': customId },
              { $set: { 'entries.$': updatedEntry } }
            );
          }
        }

        // Exit the loop if no complete lines remain in the buffer
        if (!buffer.includes('\n')) {
          break;
        }
      }
    }


  

    batch.status = 'processed';
    await batch.save();
    return { status: 'completed' };

  } catch (error) {
    console.error('Error processing batch incrementally:', error);
    throw error;
  }
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { batchId } = req.query;

      if (!batchId) {
        throw new Error('Batch ID is required');
      }
      const batch = await Batch.findOne({ batchId });
      if (!batch) {
        throw new Error('Batch not found');
      }

      const result = await handleOpenAI(batch);

      return res.status(200).json(result);

    } catch (error) {
      console.error('Error handling request:', error);
      return res.status(500).json({ error: 'Error handling request', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
