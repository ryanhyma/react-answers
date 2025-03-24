import { OpenAIEmbeddings } from '@langchain/openai';
import { getEmbeddingModelConfig } from '../config/ai-models.js';
import ServerLoggingService from './ServerLoggingService.js';
import dotenv from 'dotenv';
import { Embedding } from '../models/embedding.js';
import { Chat } from '../models/chat.js';
import { Interaction } from '../models/interaction.js';
import dbConnect from '../api/db/db-connect.js';

dotenv.config();

class EmbeddingService {
  /**
   * Creates an embedding client using LangChain's OpenAIEmbeddings
   * @param {string} provider - The provider to use (openai or azure)
   * @param {string|null} modelName - Optional specific model name, otherwise default is used
   * @returns {OpenAIEmbeddings|null} The embedding client or null if creation failed
   */
  createEmbeddingClient(provider = 'openai', modelName = null) {
    try {
      if (provider === 'openai') {
        if (!process.env.OPENAI_API_KEY) {
          ServerLoggingService.error('OpenAI API key not found', 'embedding-service');
          return null;
        }
        
        const modelConfig = getEmbeddingModelConfig('openai', modelName);
        
        return new OpenAIEmbeddings({
          openAIApiKey: process.env.OPENAI_API_KEY,
          modelName: modelConfig.name,
          dimensions: modelConfig.dimensions,
          timeout: modelConfig.timeoutMs,
          maxRetries: 3,
        });
      } else if (provider === 'azure') {
        if (!process.env.AZURE_OPENAI_API_KEY || !process.env.AZURE_OPENAI_ENDPOINT) {
          ServerLoggingService.error('Azure OpenAI credentials not found', 'embedding-service');
          return null;
        }
        
        const modelConfig = getEmbeddingModelConfig(provider, modelName) || 
                            getEmbeddingModelConfig('openai', modelName);
        
        return new OpenAIEmbeddings({
          azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
          azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-06-01',
          azureOpenAIApiDeploymentName: modelConfig.name,
          azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_ENDPOINT.replace('https://', '').replace('.openai.azure.com', ''),
          dimensions: modelConfig.dimensions,
          timeout: modelConfig.timeoutMs,
          maxRetries: 3,
        });
      } else {
        throw new Error(`Unsupported embedding provider: ${provider}`);
      }
    } catch (error) {
      ServerLoggingService.error(`Error creating embedding client for ${provider}`, 'embedding-service', error);
      return null;
    }
  }

  cleanTextForEmbedding(text) {
    return text
      .replace(/<s-\d+>|<\/s-\d+>/g, '') // remove <s-1>, </s-1>, etc.
      .replace(/\\n/g, ' ')              // replace \n with space
      .trim();
  }

  async createEmbedding(interaction, provider = 'openai', modelName = null) {
    try {
      const populatedInteraction = await interaction.populate('question answer');
      
      if (!populatedInteraction.question || !populatedInteraction.answer) {
        throw new Error('Interaction must have both question and answer');
      }

      const chat = await Chat.findOne({ 
        interactions: { $elemMatch: { $eq: interaction._id } } 
      }).populate({
        path: 'interactions',
        populate: {
          path: 'question answer',
        }
      });

      if (!chat) {
        throw new Error('Chat not found for this interaction');
      }

      const previousAndCurrentTexts = [];
      
      for (const chatInteraction of chat.interactions) {
        if (chatInteraction._id.toString() === interaction._id.toString()) {
          break;
        }
        
        if (chatInteraction.question && chatInteraction.question.englishQuestion) {
          previousAndCurrentTexts.push(this.cleanTextForEmbedding(chatInteraction.question.englishQuestion));
        }
      }
      
      if (populatedInteraction.question.englishQuestion) {
        previousAndCurrentTexts.push(this.cleanTextForEmbedding(populatedInteraction.question.englishQuestion));
      }
      
      if (populatedInteraction.answer.englishAnswer) {
        previousAndCurrentTexts.push(this.cleanTextForEmbedding(populatedInteraction.answer.englishAnswer));
      }
      
      const questionText = this.cleanTextForEmbedding(populatedInteraction.question.englishQuestion || '');
      const answerText = this.cleanTextForEmbedding(populatedInteraction.answer.englishAnswer || '');
      
      const sentences = populatedInteraction.answer.sentences || [];
      const cleanedSentences = sentences
        .map(sentence => this.cleanTextForEmbedding(sentence))
        .filter(cleaned => cleaned.trim().length > 0);
      
      const textsToEmbed = [
        questionText,
        answerText,
        previousAndCurrentTexts.join(' '),
        ...cleanedSentences
      ];
      
      const embeddings = await this.embedDocuments(
        textsToEmbed.filter(text => text.trim().length > 0),
        provider,
        modelName
      );
      
      const embeddingDoc = {
        chatId: chat._id,
        interactionId: interaction._id,
        questionId: populatedInteraction.question._id,
        answerId: populatedInteraction.answer._id,
        questionsEmbedding: embeddings[0],
        answerEmbedding: embeddings[1],
        questionsAnswerEmbedding: embeddings[2],
        sentenceEmbeddings: embeddings.slice(3, 3 + cleanedSentences.length)
      };
      await dbConnect();
      const newEmbedding = await Embedding.create(embeddingDoc);
      ServerLoggingService.info('Embedding successfully created and saved', 'embedding-service');
      
      return newEmbedding;
    } catch (error) {
      ServerLoggingService.error('Error creating embeddings for interaction', 'embedding-service', error);
      throw error;
    }
  }

  async embedDocuments(texts, provider = 'openai', modelName = null) {
    const client = this.createEmbeddingClient(provider, modelName);
    if (!client) {
      throw new Error('Failed to create embedding client');
    }
    return await client.embedDocuments(texts);
  }

  /**
   * Generate embeddings for all records without embeddings in the database.
   * @param {function} progressCallback - Callback to report progress.
   */
  async generateMissingEmbeddings(progressCallback) {
    try {
      await dbConnect();
      const interactions = await Interaction.find({
        $or: [
          { aiEval: { $exists: false } },
          { aiEval: null }
        ]
      }).populate('question answer');

      const total = interactions.length;
      let completed = 0;

      for (const interaction of interactions) {
        await this.createEmbedding(interaction);
        completed++;
        if (progressCallback) {
          progressCallback({ completed, total });
        }
      }

      return { completed, total };
    } catch (error) {
      ServerLoggingService.error('Error generating missing embeddings', 'embedding-service', error);
      throw error;
    }
  }

  /**
   * Process interactions without embeddings for a specified duration.
   * @param {number} duration - Duration in seconds to process interactions.
   * @param {function} progressCallback - Callback to report progress.
   */
  async processEmbeddingForDuration(duration) {
    const startTime = Date.now();
    let processedCount = 0;

    try {
      await dbConnect();
      
      // Find interactions that have embeddings
      const embeddingsData = await Embedding.find({}, { interactionId: 1 });
      const embeddedInteractionIds = embeddingsData.map(e => e.interactionId.toString());
      
      // Find all interactions without corresponding embeddings
      const interactions = await Interaction.find({
        _id: { $nin: embeddedInteractionIds }
      }).populate('question answer');

      const total = interactions.length;
      const remaining = total - processedCount;

      ServerLoggingService.info(`Found ${total} interactions without embeddings`, 'embedding-service');

      for (const interaction of interactions) {
        if ((Date.now() - startTime) / 1000 >= duration) {
          break;
        }

        try {
          await this.createEmbedding(interaction);
          processedCount++;
          
         
        } catch (error) {
          ServerLoggingService.error(`Error creating embedding for interaction ${interaction._id}`, 'embedding-service', error);
          // Continue processing other interactions even if one fails
        }
      }

      return { 
        completed: processedCount, 
        total,
        remaining: total - processedCount,
        duration: Math.round((Date.now() - startTime) / 1000)
      };
    } catch (error) {
      ServerLoggingService.error('Error processing interactions for duration', 'embedding-service', error);
      throw error;
    }
  }
}

export default new EmbeddingService();
