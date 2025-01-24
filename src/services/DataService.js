import { getApiUrl } from '../utils/apiToUrl.js';
const DataService = {
  persistInteraction: async (interactionData) => {

    try {
      const response = await fetch(getApiToUrl('db-log-interaction'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...interactionData,
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to log interaction');
      }

      console.log('Interaction logged successfully to database');
    } catch (error) {
      console.log('Development mode: Interaction logged to console', {
        ...interactionData
      });
    }
  }
};

export default DataService;