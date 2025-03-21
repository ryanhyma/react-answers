import { OpenAIEmbeddings } from '@langchain/openai';
import { getEmbeddingModelConfig } from '../config/ai-models.js';
import ServerLoggingService from './ServerLoggingService.js';
import dotenv from 'dotenv';

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

/**
 * Embeds a single text using the embedding client
 * @param {string} text - The text to embed
 * @param {string} provider - The provider to use
 * @param {string|null} modelName - Optional specific model name
 * @returns {Promise<number[]>} - The embedding vector
 */
const embedText = async (text, provider = 'openai', modelName = null) => {
  const embeddings = createEmbeddingClient(provider, modelName);
  if (!embeddings) {
    throw new Error('Failed to create embedding client');
  }
  
  try {
    return await embeddings.embedQuery(text);
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

export {
  createEmbeddingClient,
  embedText,
  embedDocuments
};