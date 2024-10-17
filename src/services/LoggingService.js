const LoggingService = {
    logInteraction: async (interactionData) => {
      if (process.env.REACT_APP_ENV === 'production') {
        try {
          const response = await fetch('/api/log-interaction', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(interactionData),
          });
          
          if (!response.ok) {
            throw new Error('Failed to log interaction');
          }
          
          console.log('Interaction logged successfully to database');
        } catch (error) {
          console.error('Error logging interaction to database:', error);
        }
      } else {
        console.log('Development mode: Interaction logged to console', interactionData);
      }
    }
  };
  
  export default LoggingService;