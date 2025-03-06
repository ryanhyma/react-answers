const getApiUrl = (endpoint) => {
  const baseUrl =
    process.env.NODE_ENV === 'production'
      ? process.env.REACT_APP_API_BASE_URL || '' // Use environment variable or fallback to relative paths
      : 'http://localhost:3001';

  return `${baseUrl}/api/${endpoint}`;
};

const getProviderApiUrl = (provider, endpoint) => {
  // TODO read from ModelConfig
  if (provider === 'claude') {
    provider = 'anthropic';
  } else if (provider === 'chatgpt') {
    provider = 'openai';
  }
  const baseUrl =
    process.env.NODE_ENV === 'production'
      ? process.env.REACT_APP_API_BASE_URL || '' // Use environment variable or fallback to relative paths
      : 'http://localhost:3001';

  return `${baseUrl}/api/${provider}-${endpoint}`;
};

const providerOrder = ['openai', 'anthropic', 'cohere'];

export { getApiUrl, getProviderApiUrl, providerOrder };
