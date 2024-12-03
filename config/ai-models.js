// config/ai-models.js
const AI_MODELS = {
  openai: {
    default: 'gpt-4o-2024-11-20',
    models: {
      'gpt-4o-2024-11-20': {
        maxTokens: 1024,
        temperature: 0.5,
        timeoutMs: 60000,
        knowledgeCutoff: '2024-11'
      },
      'gpt-4o': {
        maxTokens: 1024,
        temperature: 0.5,
        timeoutMs: 60000,
        knowledgeCutoff: '2024-05'
      }
    }
  },
  anthropic: {
    services: {
      chat: {
        default: 'claude-3-5-sonnet-20241022'  // For regular chat/answers
      },
      citation: {
        default: 'claude-3-5-haiku-20241022'   // For citation service
      }
    },
    models: {
      'claude-3-5-sonnet-20241022': {
        maxTokens: 1024,
        temperature: 0.5,
        knowledgeCutoff: '2024-04',
        beta: {
          promptCaching: 'prompt-caching-2024-07-31',
          messageBatches: 'message-batches-2024-09-24'
        }
      },
      'claude-3-5-haiku-20241022': {
        maxTokens: 512,
        temperature: 0.3,
        knowledgeCutoff: '2024-04',
        beta: {
          promptCaching: 'prompt-caching-2024-07-31',
          messageBatches: 'message-batches-2024-09-24'
        }
      }
    }
  },
  //TODO: When cohere is working on Vercel, implement via this config file
//   cohere: {
//     default: 'command-r-plus-08-2024',
//     models: {
//       'command-r-plus-08-2024': {
//         maxTokens: 1024,
//         temperature: 0.5,
//         knowledgeCutoff: '2024-08'
//       },
//       'command-r-plus': {
//         maxTokens: 1024,
//         temperature: 0.5,
//         knowledgeCutoff: '2024-05'
//       }
//     }
//   }
};

export const getModelConfig = (provider, service = 'chat') => {
  const providerConfig = AI_MODELS[provider];
  if (!providerConfig) {
    throw new Error(`Unknown AI provider: ${provider}`);
  }

  const modelName = providerConfig.services[service].default;
  const modelConfig = providerConfig.models[modelName];
  
  if (!modelConfig) {
    throw new Error(`Unknown model ${modelName} for provider ${provider}`);
  }

  return {
    name: modelName,
    ...modelConfig
  };
};

export default AI_MODELS;
