const getApiUrl = (endpoint) => {
    const baseUrl = process.env.NODE_ENV === 'production'
        ? ''  // Base URL for production (assuming relative paths)
        : 'http://localhost:3001';

    return `${baseUrl}/api/${endpoint}`;
};

export default getApiUrl;