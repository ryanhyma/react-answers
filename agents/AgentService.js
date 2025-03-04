import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { AzureChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatCohere } from '@langchain/cohere';
import downloadWebPageTool from './tools/downloadWebPage.js';
import checkUrlStatusTool from './tools/checkURL.js';
import { contextSearchTool } from './tools/contextSearch.js';
import { getModelConfig } from '../config/ai-models.js';
import dotenv from 'dotenv';

dotenv.config();

const agentTools = [downloadWebPageTool, checkUrlStatusTool]; // Use the imported tools
const contextTools = [contextSearchTool]; // Tools for context agent

const createOpenAIAgent = async () => {
  const modelConfig = getModelConfig('openai');
  const openai = new AzureChatOpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-06-01',
    azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
    azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME || 'openai-gpt4o-mini',
    temperature: modelConfig.temperature,
    maxTokens: modelConfig.maxTokens,
    timeout: modelConfig.timeoutMs,
  });
  const agent = await createReactAgent({
    llm: openai,
    tools: agentTools,
  });
  return agent;
};

const createCohereAgent = async () => {
  const modelConfig = getModelConfig('cohere');
  const cohere = new ChatCohere({
    apiKey: process.env.REACT_APP_COHERE_API_KEY,
    model: modelConfig.name,
    temperature: modelConfig.temperature,
    maxTokens: modelConfig.maxTokens,
  });
  const agent = await createReactAgent({
    llm: cohere,
    tools: agentTools,
  });
  return agent;
};

const createClaudeAgent = async () => {
  const modelConfig = getModelConfig('anthropic');
  const claude = new ChatAnthropic({
    apiKey: process.env.REACT_APP_ANTHROPIC_API_KEY,
    modelName: modelConfig.name,
    temperature: modelConfig.temperature,
    maxTokens: modelConfig.maxTokens,
    beta: modelConfig.beta,
  });
  const agent = await createReactAgent({
    llm: claude,
    tools: agentTools,
  });
  return agent;
};

const createContextAgent = async (agentType) => {
  let llm;

  switch (agentType) {
    case 'openai':
      const modelConfig = getModelConfig('openai');
      llm = new AzureChatOpenAI({
        apiKey: process.env.AZURE_OPENAI_API_KEY,
        azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-06-01',
        azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
        azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME || 'openai-gpt4o-mini',
        temperature: modelConfig.temperature,
        maxTokens: modelConfig.maxTokens,
        timeout: modelConfig.timeoutMs,
      });
      break;
    case 'cohere':
      llm = new CohereClient({
        apiKey: process.env.COHERE_API_KEY,
        modelName: 'command-xlarge-nightly',
        maxTokens: 4096,
        temperature: 0,
        timeoutMs: 60000,
      });
      break;
    case 'claude':
      llm = new ChatAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
        modelName: 'claude-3-5-haiku-20241022',
        maxTokens: 8192,
        temperature: 0,
        timeoutMs: 60000,
      });
      break;
    default:
      throw new Error(`Unknown agent type: ${agentType}`);
  };
  const agent = await createReactAgent({
    llm: llm,
    tools: contextTools,
  });
  return agent;
}





const createAgents = async () => {
  const openAIAgent = await createOpenAIAgent();
  const cohereAgent = null; //await createCohereAgent();
  const claudeAgent = await createClaudeAgent();
  const contextAgent = await createContextAgent('openai');
  return { openAIAgent, cohereAgent, claudeAgent, contextAgent };
};

const getAgent = (agents, selectedAgent) => {
  switch (selectedAgent) {
    case 'openai':
      return agents.openAIAgent;
    case 'cohere':
      return agents.cohereAgent;
    case 'claude':
      return agents.claudeAgent;
    case 'context':
      return agents.contextAgent;
    default:
      throw new Error('Invalid agent specified');
  }
};

export { createAgents, getAgent, createClaudeAgent, createCohereAgent, createOpenAIAgent, createContextAgent };
