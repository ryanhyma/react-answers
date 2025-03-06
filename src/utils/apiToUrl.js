const getApiUrl = (endpoint) => {
  const baseUrl =
    process.env.NODE_ENV === 'production'
      ? window.location.origin 
      : 'http://localhost:3001';
  return `${baseUrl}/api/${endpoint}`;
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

  const baseUrl =
    process.env.NODE_ENV === 'production'
      ? window.location.origin
      : 'http://localhost:3001';
  return `${baseUrl}/api/${provider}-${endpoint}`;
};

const providerOrder = ['openai', 'azure', 'anthropic', 'cohere'];

export { getApiUrl, getProviderApiUrl, providerOrder };
