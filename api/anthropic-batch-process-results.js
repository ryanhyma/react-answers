import Anthropic from "@anthropic-ai/sdk";
import { Batch } from "../models/batch.js";
import dbConnect from "./db-connect.js";
import { Context } from "../models/context.js";
import { Question } from "../models/question.js";
import { Interaction } from "../models/interaction.js";
import { Answer } from "../models/answer.js";
import ContextService from "../src/services/ContextService.js";


const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  headers: {
    'anthropic-beta': 'message-batches-2024-09-24'
  }
});

const handleAnthropic = async (batch) => {
  try {
    const resultsStream = await anthropic.beta.messages.batches.results(batch.batchId);

    for await (const result of resultsStream) {
      const customId = result.custom_id;
      batch = await Batch.findById(batch._id).populate('interactions');
      const interaction = batch.interactions.find(interaction => interaction.interactionId === customId);
      if (interaction) {
        let updatedEntry = null;

        if (batch.type === 'context') {
          // TODO fix this when services moved to server side
          const response = result.result.message.content[0].text;
          const topicMatch = response.match(/<topic>([\s\S]*?)<\/topic>/);
          const topicUrlMatch = response.match(/<topicUrl>([\s\S]*?)<\/topicUrl>/);
          const departmentMatch = response.match(/<department>([\s\S]*?)<\/department>/);
          const departmentUrlMatch = response.match(/<departmentUrl>([\s\S]*?)<\/departmentUrl>/);

            let context = await Context.findById(interaction.context);
            context.topic = topicMatch ? topicMatch[1] : context.topic;
            context.topicUrl = topicUrlMatch ? topicUrlMatch[1] : context.topicUrl;
            context.department = departmentMatch ? departmentMatch[1] : context.department;
            context.departmentUrl = departmentUrlMatch ? departmentUrlMatch[1] : context.departmentUrl;
            context.model = result.result.message.model;
            context.inputTokens = result.result.message.usage.input_tokens;
            context.outputTokens = result.result.message.usage.output_tokens;
            context.cachedCreationInputTokens = result.result.message.usage.cache_creation_input_tokens;
            context.cachedReadInputTokens = result.result.message.usage.cache_read_input_tokens;
            await context.save();
            const question = await Question.findById(interaction.question);
            await question.save();
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

      }
    }

    batch.status = 'processed';
    await batch.save();
    return {
      status: "completed",
    };

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
      await dbConnect();
      const batch = await Batch.findOne({ batchId });
      if (!batch) {
        throw new Error('Batch not found');
      }

      let result = await handleAnthropic(batch);

      return res.status(200).json(result);

    } catch (error) {
      console.error('Error handling request:', error);
      return res.status(500).json({ error: 'Error handling request', log: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
