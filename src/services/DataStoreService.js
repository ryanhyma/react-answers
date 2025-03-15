import { getApiUrl } from '../utils/apiToUrl.js';
import AuthService from './AuthService.js';

class DataStoreService {
  static async checkDatabaseConnection() {
    if (process.env.REACT_APP_ENV !== 'production') {
      console.log('Skipping database connection check in development environment');
      return true;
    }

    try {
      const response = await fetch(getApiUrl('db-check'));
      if (!response.ok) {
        throw new Error('Database connection failed');
      }
      const data = await response.json();
      console.log('Database connection status:', data.message);
      return true;
    } catch (error) {
      console.error('Error checking database connection:', error);
      return false;
    }
  }

  static async persistBatch(batchData) {
    try {
      const response = await fetch(getApiUrl('db-batch'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...AuthService.getAuthHeader()
        },
        body: JSON.stringify(batchData)
      });
      
      if (!response.ok) throw new Error('Failed to persist batch');
      return await response.json();
    } catch (error) {
      console.error('Error persisting batch:', error);
      throw error;
    }
  }

  static async getBatchList() {
    try {
      const response = await fetch(getApiUrl('db-batch-list'), {
        headers: AuthService.getAuthHeader()
      });
      
      if (!response.ok) throw new Error('Failed to get batch list');
      return await response.json();
    } catch (error) {
      console.error('Error getting batch list:', error);
      throw error;
    }
  }

  static async getBatch(batchId) {
    try {
      const response = await fetch(getApiUrl(`db-batch-retrieve?batchId=${batchId}`), {
        headers: AuthService.getAuthHeader()
      });
      
      if (!response.ok) throw new Error('Failed to retrieve batch');
      return await response.json();
    } catch (error) {
      console.error('Error retrieving batch:', error);
      throw error;
    }
  }

  static async persistInteraction(interactionData) {
    try {
      
      const response = await fetch(getApiUrl('db-persist-interaction'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(interactionData)
      });
      
      if (!response.ok) throw new Error('Failed to persist interaction');
      return await response.json();
    } catch (error) {
      console.error('Error persisting interaction:', error);
      throw error;
    }
  }

  static async persistFeedback(feedbackData) {
    try {
      const response = await fetch(getApiUrl('db-persist-feedback'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedbackData)
      });
      
      if (!response.ok) throw new Error('Failed to persist feedback');
      return await response.json();
    } catch (error) {
      console.error('Error persisting feedback:', error);
      throw error;
    }
  }

  static async getChatSession(sessionId) {
    try {
      const response = await fetch(getApiUrl(`db-chat-session?sessionId=${sessionId}`), {
        headers: AuthService.getAuthHeader()
      });
      
      if (!response.ok) throw new Error('Failed to get chat session');
      return await response.json();
    } catch (error) {
      console.error('Error getting chat session:', error);
      throw error;
    }
  }

  static async getChatLogs(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(getApiUrl(`db-chat-logs?${queryParams}`), {
        headers: AuthService.getAuthHeader()
      });
      
      if (!response.ok) throw new Error('Failed to get chat logs');
      return await response.json();
    } catch (error) {
      console.error('Error getting chat logs:', error);
      throw error;
    }
  }
}

export default DataStoreService;
