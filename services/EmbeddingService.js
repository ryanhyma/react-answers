import { OpenAIEmbeddings } from '@langchain/openai';
import { getEmbeddingModelConfig } from '../config/ai-models.js';
import ServerLoggingService from './ServerLoggingService.js';
import dotenv from 'dotenv';
import cosineSimilarity from 'compute-cosine-similarity';

dotenv.config();

/**
 * Creates an embedding client using LangChain's OpenAIEmbeddings
 * @param {string} provider - The provider to use (openai or azure)
 * @param {string|null} modelName - Optional specific model name, otherwise default is used
 * @returns {OpenAIEmbeddings|null} The embedding client or null if creation failed
 */
const createEmbeddingClient = (provider = 'openai', modelName = null) => {
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
      
      // Get the model config - falling back to OpenAI config if Azure doesn't have embeddings yet
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
};

function cleanTextForEmbedding(text) {
  return text
    .replace(/<s-\d+>|<\/s-\d+>/g, '') // remove <s-1>, </s-1>, etc.
    .replace(/\\n/g, ' ')              // replace \n with space
    .trim();
}

/**
 * Embeds a single text using the embedding client
 * @param {string} text - The text to embed
 * @param {string} provider - The provider to use
 * @param {string|null} modelName - Optional specific model name
 * @returns {Promise<number[]>} - The embedding vector
 */
const embedText = async (text, provider = 'openai', modelName = null) => {
  const cleanedText = cleanTextForEmbedding(text);
  const embeddings = createEmbeddingClient(provider, modelName);
  if (!embeddings) {
    throw new Error('Failed to create embedding client');
  }
  
  try {
    return await embeddings.embedQuery(cleanedText);
  } catch (error) {
    ServerLoggingService.error('Error embedding text', 'embedding-service', error);
    throw error;
  }
};

/**
 * Embeds multiple documents in batch for efficiency
 * @param {string[]} documents - Array of text documents to embed
 * @param {string} provider - The provider to use
 * @param {string|null} modelName - Optional specific model name
 * @returns {Promise<number[][]>} - Array of embedding vectors
 */
const embedDocuments = async (documents, provider = 'openai', modelName = null) => {
  const embeddings = createEmbeddingClient(provider, modelName);
  if (!embeddings) {
    throw new Error('Failed to create embedding client');
  }
  
  try {
    return await embeddings.embedDocuments(documents);
  } catch (error) {
    ServerLoggingService.error('Error embedding documents', 'embedding-service', error);
    throw error;
  }
};

/**
 * Calculate similarity between two answers at the sentence level using embeddings
 * @param {Answer} answer1 - First answer with sentence embeddings
 * @param {Answer} answer2 - Second answer with sentence embeddings
 * @returns {number} Average similarity score across best-matching sentences
 */
const calculateSentenceSimilarity = (answer1, answer2) => {
  if (!answer1?.sentenceEmbeddings?.length || !answer2?.sentenceEmbeddings?.length) {
    return 0;
  }

  try {
    // Create similarity matrix using sentence embeddings
    const similarityMatrix = answer1.sentenceEmbeddings.map(embedding1 =>
      answer2.sentenceEmbeddings.map(embedding2 => 
        cosineSimilarity(embedding1, embedding2)
      )
    );

    // Calculate average of best matches for each sentence
    const bestMatches = similarityMatrix.map(row =>
      Math.max(...row)
    );

    return bestMatches.reduce((a, b) => a + b, 0) / bestMatches.length;
  } catch (error) {
    ServerLoggingService.error('Error calculating sentence similarity', 'embedding-service', error);
    return 0;
  }
};

export {
  createEmbeddingClient,
  embedText,
  embedDocuments,
  calculateSentenceSimilarity
};