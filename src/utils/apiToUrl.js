const getApiUrl = (endpoint) => {
  return `${process.env.SERVER_URL}/api/${endpoint}`;
};

const getProviderApiUrl = (provider, endpoint) => {
  // Map provider aliases to their actual service names
  if (provider === 'claude') {
    provider = 'anthropic';
  } else if (provider === 'chatgpt') {
    provider = 'openai';
  } else if (provider === 'azure-openai' || provider === 'azure') {
    provider = 'azure';
  }

  return `${process.env.SERVER_URL}/api/${provider}-${endpoint}`;
};

const providerOrder = ['openai', 'azure', 'anthropic', 'cohere'];

export { getApiUrl, getProviderApiUrl, providerOrder };
