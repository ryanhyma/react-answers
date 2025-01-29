import { UserSquare } from 'lucide-react';
import { getApiUrl } from '../utils/apiToUrl.js';
export const DataStoreService = {
  checkDatabaseConnection: async () => {
    if (process.env.REACT_APP_ENV !== 'production') {
      console.log('Skipping database connection check in development environment');
      return true;
    }

    try {
      const response = await fetch(getApiUrl("db-check"));
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
  },

  persistInteractionSmall: async (interactionData) => {


  },
  persistInteraction: async (
    selectedAI,
    question,
    userMessageId,
    referringUrl,
    answer,
    finalCitationUrl,
    confidenceRating,
    context,
    chatId,
  ) => {
    const interaction = {
      selectedAI: selectedAI,
      question: question,
      referringUrl: referringUrl,
      answer: answer,
      userMessageId: userMessageId,
      finalCitationUrl: finalCitationUrl,
      confidenceRating: confidenceRating,
      context: context,
      chatId: chatId,
    };

    try {
      const response = await fetch(getApiUrl('db-persist-interaction'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          interaction
        ),
      });

      if (!response.ok) {
        throw new Error('Failed to log interaction');
      }

      console.log('Interaction logged successfully to database');
    } catch (error) {
      console.log('Development mode: Interaction logged to console', {
        ...interaction
      });
    }
  },
  persistFeedback: async (messages, checkedCitations, isPositive, referringUrl, originalCitationUrl, citationUrl, confidenceRating, preliminaryChecks, englishAnswer, content, expertFeedback) => {
    // Standardize expert feedback format - only accept new format
    let formattedExpertFeedback = null;
    if (expertFeedback) {
      formattedExpertFeedback = {
        totalScore: expertFeedback.totalScore ?? null,
        sentence1Score: expertFeedback.sentence1Score ?? null,
        sentence2Score: expertFeedback.sentence2Score ?? null,
        sentence3Score: expertFeedback.sentence3Score ?? null,
        sentence4Score: expertFeedback.sentence4Score ?? null,
        citationScore: expertFeedback.citationScore ?? null,
        answerImprovement: expertFeedback.answerImprovement || '',
        expertCitationUrl: expertFeedback.expertCitationUrl || ''
      };
    }


    const feedback = isPositive ? 'positive' : 'negative';
    console.log(`User feedback: ${feedback}`, expertFeedback);

    // Get the last message (which should be the AI response)
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.sender === 'ai') {
      const { text: aiResponse, aiService: selectedAIService } = lastMessage;
      // Get original URL from AI response

      // Get validated URL from checkedCitations
      const lastIndex = messages.length - 1;
      const validationResult = checkedCitations[lastIndex];
      const finalCitationUrl = validationResult?.url || validationResult?.fallbackUrl;

      // Get the user's message (which should be the second-to-last message)
      const userMessage = messages[messages.length - 2];
      if (userMessage && userMessage.sender === 'user') {
        // Only log if there's feedback
        DataStoreService.persistInteraction(
          selectedAIService,
          userMessage.redactedText,
          referringUrl,
          aiResponse,
          finalCitationUrl,
          originalCitationUrl,
          confidenceRating,
          feedback,
          expertFeedback
        );
      }
    }
  }

};

