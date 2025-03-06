import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { AzureChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatCohere } from '@langchain/cohere';
import downloadWebPageTool from './tools/downloadWebPage.js';
import checkUrlStatusTool from './tools/checkURL.js';
import { ToolTrackingHandler } from './ToolTrackingHandler.js';
import { getModelConfig } from '../config/ai-models.js';
import dotenv from 'dotenv';

dotenv.config();

const createTools = (chatId = 'system') => {
  const callbacks = [new ToolTrackingHandler(chatId)];
  
  // Wrap tools with callbacks to ensure consistent tracking
  const wrapToolWithCallbacks = (tool) => ({
    ...tool,
    invoke: async (params) => {
      return tool.invoke({
        ...params,
        args: {
          ...params.args,
          chatId
        }
      }, { callbacks });
    }
  });

  return {
    tools: [
      wrapToolWithCallbacks(downloadWebPageTool),
      wrapToolWithCallbacks(checkUrlStatusTool),
      wrapToolWithCallbacks(googleContextSearchTool),
      wrapToolWithCallbacks(canadaCaContextSearchTool)
    ],
    callbacks
  };
};

const createOpenAIAgent = async (chatId = 'system') => {
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

  const { tools, callbacks } = createTools(chatId);
  const agent = await createReactAgent({ llm: openai, tools });
  agent.callbacks = callbacks;
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

  const { tools, callbacks } = createTools(chatId);
  const agent = await createReactAgent({ llm: cohere, tools });
  agent.callbacks = callbacks;
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

  const { tools, callbacks } = createTools(chatId);
  const agent = await createReactAgent({ llm: claude, tools });
  agent.callbacks = callbacks;
  return agent;
};

const createContextAgent = async (agentType, chatId = 'system') => {
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

  // Context agent doesn't need tools, just callbacks for tracking
  const callbacks = [new ToolTrackingHandler(chatId)];
  const agent = await createReactAgent({ llm, tools: [] });
  agent.callbacks = callbacks;
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
