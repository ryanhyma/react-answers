const getApiUrl = (endpoint) => {
    const baseUrl = process.env.NODE_ENV === 'production'
        ? ''  // Base URL for production (assuming relative paths)
        : 'http://localhost:3001';

    return `${baseUrl}/api/${endpoint}`;
};

const getProviderApiUrl = (provider,endpoint) => {
    const baseUrl = process.env.NODE_ENV === 'production'
        ? ''  // Base URL for production (assuming relative paths)
        : 'http://localhost:3001';

    return `${baseUrl}/api/${provider}-${endpoint}`;
};

const providerOrder = ['openai', 'anthropic', 'cohere'];



export { getApiUrl, getProviderApiUrl, providerOrder };