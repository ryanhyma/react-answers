import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatCohere } from '@langchain/cohere';
import downloadWebPageTool from './tools/downloadWebPage.js';
import checkUrlStatusTool from './tools/checkURL.js';
import { getModelConfig } from '../config/ai-models.js';
import dotenv from 'dotenv';

dotenv.config();

const createToolsWithContext = (chatId = 'system') => {
  return [
    {
      ...downloadWebPageTool,
      invoke: async (params) => {
        return downloadWebPageTool.invoke({
          ...params,
          args: {
            ...params.args,
            chatId
          }
        });
      }
    },
    {
      ...checkUrlStatusTool,
      invoke: async (params) => {
        return checkUrlStatusTool.invoke({
          ...params,
          args: {
            ...params.args,
            chatId
          }
        });
      }
    }
  ];
};

const createOpenAIAgent = async (chatId = 'system') => {
  const modelConfig = getModelConfig('openai');
  const openai = new ChatOpenAI({
    modelName: modelConfig.name,
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    temperature: modelConfig.temperature,
    maxTokens: modelConfig.maxTokens,
    timeoutMs: modelConfig.timeoutMs,
  });
  const agent = await createReactAgent({
    llm: openai,
    tools: createToolsWithContext(chatId),
  });
  return agent;
};

const createCohereAgent = async (chatId = 'system') => {
  const modelConfig = getModelConfig('cohere');
  const cohere = new ChatCohere({
    apiKey: process.env.REACT_APP_COHERE_API_KEY,
    model: modelConfig.name,
    temperature: modelConfig.temperature,
    maxTokens: modelConfig.maxTokens,
  });
  const agent = await createReactAgent({
    llm: cohere,
    tools: createToolsWithContext(chatId),
  });
  return agent;
};

const createClaudeAgent = async (chatId = 'system') => {
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
    tools: createToolsWithContext(chatId),
  });
  return agent;
};

const createContextAgent = async (agentType, chatId = 'system') => {
  let llm;

  switch (agentType) {
    case 'openai':
      llm = new ChatOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        modelName: 'gpt-4o',
        maxTokens: 8192,
        temperature: 0,
        timeoutMs: 60000,
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
    case 'anthropic':
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
    tools: createToolsWithContext(chatId),
  });
  return agent;
}

const createAgents = async (chatId = 'system') => {
  const openAIAgent = await createOpenAIAgent(chatId);
  const cohereAgent = null; //await createCohereAgent(chatId);
  const claudeAgent = await createClaudeAgent(chatId);
  const contextAgent = await createContextAgent('openai', chatId);
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