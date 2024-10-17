const LoggingService = {
    logInteraction: async (interactionData) => {
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
        
        console.log('Interaction logged successfully');
      } catch (error) {
        console.error('Error logging interaction:', error);
      }
    }
  };
  
  export default LoggingService;