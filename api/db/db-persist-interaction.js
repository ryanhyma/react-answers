import dbConnect from './db-connect.js';
import { Chat } from '../../models/chat.js';
import { Interaction } from '../../models/interaction.js';
import { Context } from '../../models/context.js';
import { Question } from '../../models/question.js';
import { Citation } from '../../models/citation.js';
import { Answer } from '../../models/answer.js';
import { Tool } from '../../models/tool.js';
import { embedDocuments } from '../../services/EmbeddingService.js';
import ServerLoggingService from '../../services/ServerLoggingService.js';
import EvaluationService from '../../services/EvaluationService.js';

/**
 * Process all embeddings in a single batch to optimize API calls
 * @param {string} questionText - The question text to embed
 * @param {string} answerContent - The answer content to embed
 * @param {string[]} sentences - The individual sentences to embed
 * @param {string} chatId - Chat ID for logging purposes
 * @returns {Object} Object containing all generated embeddings
 */
async function batchProcessEmbeddings(questionText, answerContent, sentences, chatId) {
  try {
    // Prepare a single array with all texts that need embeddings
    let allTexts = [];
    const textMap = {};
    let currentIndex = 0;
    
    // Add question text
    if (questionText) {
      allTexts.push(questionText);
      textMap.questionIndex = currentIndex++;
    }
    
    // Add answer content
    if (answerContent) {
      allTexts.push(answerContent);
      textMap.answerIndex = currentIndex++;
    }
    
    // Add sentence texts
    if (sentences && sentences.length > 0) {
      textMap.sentencesStartIndex = currentIndex;
      textMap.sentencesEndIndex = currentIndex + sentences.length - 1;
      allTexts.push(...sentences);
    }

    // Remove empty elements from the allTexts array
    allTexts = allTexts.filter(text => text && text.trim().length > 0);
    
    // If no texts to embed, return empty object
    if (allTexts.length === 0) {
      return {};
    }
    
    // Execute a single embedding operation for all texts
    const allEmbeddings = await embedDocuments(allTexts);
    
    // Organize results into a structured object
    const result = {};
    if ('questionIndex' in textMap) {
      result.questionEmbedding = allEmbeddings[textMap.questionIndex];
    }
    
    if ('answerIndex' in textMap) {
      result.answerEmbedding = allEmbeddings[textMap.answerIndex];
    }
    
    if ('sentencesStartIndex' in textMap && 'sentencesEndIndex' in textMap) {
      result.sentenceEmbeddings = allEmbeddings.slice(
        textMap.sentencesStartIndex,
        textMap.sentencesEndIndex + 1
      );
    }
    
    return result;
  } catch (error) {
    ServerLoggingService.error('Failed to generate embeddings batch', chatId, error);
    // Return empty object on error
    return {};
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await dbConnect();

    const interaction = req.body;
    let chatId = interaction.chatId;
    let chat = await Chat.findOne({ chatId: chatId });

    if (!chat) {
      chat = new Chat();
    }
    chat.chatId = interaction.chatId;
    chat.aiProvider = interaction.selectedAI;
    chat.searchProvider = interaction.searchProvider;
    chat.pageLanguage = interaction.pageLanguage;
    
    // Create all MongoDB document objects without saving them yet
    const dbInteraction = new Interaction();
    dbInteraction.interactionId = interaction.userMessageId;
    dbInteraction.responseTime = interaction.responseTime;
    dbInteraction.referringUrl = interaction.referringUrl;
    
    const context = new Context();
    Object.assign(context, interaction.context);
    dbInteraction.context = context._id;

    const citation = new Citation();
    citation.aiCitationUrl = interaction.answer.citationUrl;
    citation.providedCitationUrl = interaction.finalCitationUrl;
    citation.confidenceRating = interaction.confidenceRating;
    citation.citationHead = interaction.answer.citationHead;

    const answer = new Answer();
    answer.citation = citation._id;
    Object.assign(answer, interaction.answer);
    answer.sentences = interaction.answer.sentences;
    
    const question = new Question();
    question.redactedQuestion = interaction.question;
    question.language = interaction.answer.questionLanguage;
    question.englishQuestion = interaction.answer.englishQuestion;

    // Process all embeddings as a single batch using embedDocuments
    const embeddings = await batchProcessEmbeddings(
      interaction.question,
      interaction.answer.content,
      answer.sentences,
      interaction.chatId
    );

    // Assign embeddings to their respective objects if available
    if (embeddings.questionEmbedding) {
      question.embedding = embeddings.questionEmbedding;
    }
    if (embeddings.answerEmbedding) {
      answer.embedding = embeddings.answerEmbedding;
    }
    if (embeddings.sentenceEmbeddings) {
      answer.sentenceEmbeddings = embeddings.sentenceEmbeddings;
    }

    // Handle tools data with proper validation
    const toolsData = Array.isArray(interaction.answer.tools) ? interaction.answer.tools : [];
    const toolObjects = toolsData.map(toolData => new Tool({
      tool: toolData.tool,
      input: toolData.input,
      output: toolData.output,
      startTime: toolData.startTime,
      endTime: toolData.endTime,
      duration: toolData.duration,
      status: toolData.status || 'completed',
      error: toolData.error
    }));
    
    // Now save everything to MongoDB in a more optimized way
    // 1. Save the tools first
    if (toolObjects.length > 0) {
      const savedTools = await Tool.insertMany(toolObjects);
      answer.tools = savedTools.map(tool => tool._id);
    } else {
      answer.tools = [];
    }
    
    // 2. Save other entities
    await context.save();
    await citation.save();
    await answer.save();
    await question.save();
    
    // 3. Complete the interaction references and save
    dbInteraction.answer = answer._id;
    dbInteraction.question = question._id;
    await dbInteraction.save();
    
    // 4. Update and save the chat
    chat.interactions.push(dbInteraction._id);
    await chat.save();

    // 5. Perform evaluation on the saved interaction
    try {
      const evaluationResult = await EvaluationService.evaluateInteraction(dbInteraction, chatId);
      if (evaluationResult) {
        ServerLoggingService.info('Evaluation completed successfully', chat.chatId, {
          evaluationId: evaluationResult._id
        });
      }
    } catch (evalError) {
      // Log evaluation error but don't fail the request
      ServerLoggingService.error('Evaluation failed', chat.chatId, evalError);
    }

    res.status(200).json({ message: 'Interaction logged successfully' });
  } catch (error) {
    ServerLoggingService.error('Failed to log interaction', req.body?.chatId || 'system', error);
    res.status(500).json({ message: 'Failed to log interaction', error: error.message });
  }
}