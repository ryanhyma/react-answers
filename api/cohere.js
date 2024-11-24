// api/cohere.js
import { 
  CohereClient, 
  CohereError, 
  CohereTimeoutError,
  CohereBadRequestError,
  CohereUnauthorizedError,
  CohereForbiddenError,
  CohereNotFoundError,
  CohereUnprocessableEntityError,
  CohereTooManyRequestsError,
  CohereInternalServerError
} from 'cohere-ai/v2';

export default async function handler(req, res) {
  console.log('Starting Cohere handler');
  console.log('Environment check:', {
    hasApiKey: !!process.env.COHERE_API_KEY,
    nodeEnv: process.env.NODE_ENV
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Initializing Cohere client');
    const cohere = new CohereClient({
      token: process.env.COHERE_API_KEY,
    });
    console.log('Cohere client initialized');

    const { messages } = req.body;
    console.log('Request body received:', {
      messageCount: messages?.length,
      messageTypes: messages?.map(m => m.role)
    });

    // Get the latest message and chat history
    const userMessage = messages[messages.length - 1].content;
    const chat_history = messages.slice(1, -1).map(msg => ({
      role: msg.role.toUpperCase(),
      message: msg.content
    }));

    console.log('Prepared request:', {
      userMessage: userMessage?.substring(0, 50) + '...',
      chatHistoryLength: chat_history.length,
      model: 'command-r-plus-08-2024'
    });

    // Make the API call
    console.log('Making Cohere API call');
    const response = await cohere.chat({
      model: 'command-r-plus-08-2024',
      message: userMessage,
      chat_history: chat_history,
      temperature: 0.5
    });
    console.log('Cohere API call successful');

    return res.status(200).json({ content: response.text });
  } catch (error) {
    console.error('Initial error catch:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      type: error.constructor.name
    });

    // Handle specific error types
    if (error instanceof CohereTimeoutError) {
      console.error('Timeout error:', error);
      return res.status(504).json({ 
        error: 'Request timed out',
        details: error.message,
        type: 'timeout'
      });
    } else if (error instanceof CohereBadRequestError) {
      console.error('Bad request error:', error);
      return res.status(400).json({
        error: 'Bad request',
        details: error.body,
        type: 'bad_request'
      });
    } else if (error instanceof CohereUnauthorizedError) {
      console.error('Unauthorized error:', error);
      return res.status(401).json({
        error: 'Invalid API key or unauthorized',
        details: error.body,
        type: 'unauthorized'
      });
    } else if (error instanceof CohereForbiddenError) {
      console.error('Forbidden error:', error);
      return res.status(403).json({
        error: 'Forbidden',
        details: error.body,
        type: 'forbidden'
      });
    } else if (error instanceof CohereNotFoundError) {
      console.error('Not found error:', error);
      return res.status(404).json({
        error: 'Resource not found',
        details: error.body,
        type: 'not_found'
      });
    } else if (error instanceof CohereUnprocessableEntityError) {
      console.error('Unprocessable entity error:', error);
      return res.status(422).json({
        error: 'Unprocessable entity',
        details: error.body,
        type: 'unprocessable_entity'
      });
    } else if (error instanceof CohereTooManyRequestsError) {
      console.error('Rate limit error:', error);
      return res.status(429).json({
        error: 'Too many requests',
        details: error.body,
        type: 'rate_limit'
      });
    } else if (error instanceof CohereInternalServerError) {
      console.error('Cohere internal server error:', error);
      return res.status(500).json({
        error: 'Cohere internal server error',
        details: error.body,
        type: 'internal_server'
      });
    } else if (error instanceof CohereError) {
      // Catch any other Cohere-specific errors
      console.error('Other Cohere error:', {
        statusCode: error.statusCode,
        message: error.message,
        body: error.body
      });
      return res.status(error.statusCode || 500).json({ 
        error: error.message,
        details: error.body,
        type: 'cohere_other'
      });
    } else {
      // Catch any other unexpected errors
      console.error('Unexpected error:', error);
      return res.status(500).json({ 
        error: 'An unexpected error occurred',
        details: error.message,
        type: 'unexpected'
      });
    }
  }
}