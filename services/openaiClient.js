import OpenAI from 'openai';
import { getModelConfig } from '../config/ai-models.js';

/**
 * Creates an OpenAI client for direct API calls (non-LangChain usage)
 * For LangChain usage, use the ChatOpenAI or AzureChatOpenAI classes directly
 */
const createOpenAIClient = () => {
    const modelConfig = getModelConfig('openai');
    
    if (process.env.OPENAI_API_KEY) {
        return new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            maxRetries: 3,
            timeout: modelConfig.timeoutMs,
        });
    } else if (process.env.AZURE_OPENAI_API_KEY) {
        const azureConfig = modelConfig.azure;
        return new OpenAI({
            apiKey: process.env.AZURE_OPENAI_API_KEY,
            baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${azureConfig.deploymentName}`,
            defaultQuery: { 'api-version': azureConfig.apiVersion },
            defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY },
            maxRetries: 3,
            timeout: modelConfig.timeoutMs,
        });
    } else {
        throw new Error('No OpenAI API key found. Please set either OPENAI_API_KEY or AZURE_OPENAI_API_KEY in your environment variables.');
    }
};

export default createOpenAIClient;