import ChatInteraction from '../components/chat/ChatInteraction.js';

const LoggingService = {
  logInteraction: async (interactionData) => {
    try {
      const newInteraction = new ChatInteraction(interactionData);
      await newInteraction.save();
      console.log('Interaction logged successfully');
    } catch (error) {
      console.error('Error logging interaction:', error);
    }
  }
};

export default LoggingService;