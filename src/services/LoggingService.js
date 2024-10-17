const LoggingService = {
    logInteraction: async (interactionData) => {
      try {
        if (process.env.REACT_APP_ENV === 'production') {
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
        } else {
          console.log('Interaction logging skipped (not in production environment)');
        }
      } catch (error) {
        console.error('Error logging interaction:', error);
      }
    }
  };
  
  export default LoggingService;