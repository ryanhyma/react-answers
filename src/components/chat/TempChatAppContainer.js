import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ClaudeService from '../../services/ClaudeService.js';
import ChatGPTService from '../../services/ChatGPTService.js';
import CohereService from '../../services/CohereService.js';
import RedactionService from '../../services/RedactionService.js';
import FeedbackComponent from './FeedbackComponent';
import LoggingService from '../../services/LoggingService.js';
import { GcdsTextarea, GcdsButton, GcdsDetails } from '@cdssnc/gcds-components-react';
import '../../styles/App.css';
import { urlValidator } from '../../utils/urlValidator.js';
import { useTranslations } from '../../hooks/useTranslations';

// Utility functions go here, before the component
const extractSentences = (paragraph) => {
  const sentenceRegex = /<s-\d+>(.*?)<\/s-\d+>/g;
  const sentences = [];
  let match;
  while ((match = sentenceRegex.exec(paragraph)) !== null) {
    sentences.push(match[1].trim());
  }
  return sentences.length > 0 ? sentences : [paragraph];
};

// Move parsing logic outside component
const parseMessageContent = (text) => {
  let responseType = 'normal';
  let content = text;

  if (content.includes('<not-gc>')) {
    responseType = 'not-gc';
    content = content.replace(/<not-gc>/g, '').replace(/<\/not-gc>/g, '').trim();
  } 
  if (content.includes('<pt-muni>')) {
    responseType = 'pt-muni';
    content = content.replace(/<pt-muni>/g, '').replace(/<\/pt-muni>/g, '').trim();
  }
  if (content.includes('<clarifying-question>')) {
    responseType = 'question';
    content = content.replace(/<clarifying-question>/g, '').replace(/<\/clarifying-question>/g, '').trim();
  }
  
  return { responseType, content };
};

const TempChatAppContainer = ({ lang = 'en' }) => {
  const { t } = useTranslations(lang);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [textareaKey, setTextareaKey] = useState(0);
  const [selectedAI, setSelectedAI] = useState('chatgpt');
  const [showFeedback, setShowFeedback] = useState(false);
  const [checkedCitations, setCheckedCitations] = useState({});
  const [referringUrl, setReferringUrl] = useState('');
  const MAX_CONVERSATION_TURNS = 3;
  const [turnCount, setTurnCount] = useState(0);
  const MAX_CHAR_LIMIT = 400;
  const messageIdCounter = useRef(0);

  // Add a ref to track if we're currently typing
  const isTyping = useRef(false);

  const handleInputChange = (e) => {
    isTyping.current = true;
    setInputText(e.target.value);
    // Reset typing state after a short delay
    setTimeout(() => {
      isTyping.current = false;
    }, 100);
  };

  const handleAIToggle = (e) => {
    setSelectedAI(e.target.value);
    console.log('AI toggled to:', e.target.value); // Add this line for debugging
  };

  const clearInput = useCallback(() => {
    setInputText('');
    setTextareaKey(prevKey => prevKey + 1);
  }, []);

  const parseAIResponse = useCallback((text, aiService) => {
    // console.log('Parsing AI response:', text, aiService);
    const citationHeadRegex = /<citation-head>(.*?)<\/citation-head>/;
    const citationUrlRegex = /<citation-url>(.*?)<\/citation-url>/;
    const confidenceRatingRegex = /<confidence>(.*?)<\/confidence>/;

    const headMatch = text.match(citationHeadRegex);
    const urlMatch = text.match(citationUrlRegex);
    const confidenceMatch = text.match(confidenceRatingRegex);

    let mainContent = text
      .replace(citationHeadRegex, '')
      .replace(citationUrlRegex, '')
      .replace(confidenceRatingRegex, '')
      .trim();

    // Split content into paragraphs, preserving sentence tags
    const paragraphs = mainContent.split(/\n+/);

    const result = {
      paragraphs,
      citationHead: headMatch ? headMatch[1] : null,
      citationUrl: urlMatch ? urlMatch[1] : null,
      confidenceRating: confidenceMatch ? confidenceMatch[1] : null,
      aiService
    };
    // console.log('Parsed AI response:', result);
    return result;
  }, []);

  const logInteraction = useCallback((
    redactedQuestion, 
    aiResponse, 
    aiService, 
    referringUrl, 
    citationUrl,
    originalCitationUrl,
    confidenceRating,
    feedback,
    expertFeedback
  ) => {
    console.log('Logging interaction with referringUrl:', referringUrl);

    const logEntry = {
      redactedQuestion,
      aiResponse,
      aiService,
      ...(referringUrl && { referringUrl }),
      citationUrl,
      originalCitationUrl,
      ...(confidenceRating && { confidenceRating }),
      ...(feedback !== undefined && { feedback }),
      ...(expertFeedback && { expertFeedback })
    };

    console.log('Final log entry:', logEntry);
    
    if (process.env.REACT_APP_ENV === 'production') {
      LoggingService.logInteraction(logEntry, false);
    }
  }, []);

  const handleFeedback = useCallback((isPositive, expertFeedback = null) => {
    const feedback = isPositive ? 'positive' : 'negative';
    console.log(`User feedback: ${feedback}`, expertFeedback);

    // Get the last message (which should be the AI response)
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.sender === 'ai') {
      const { text: aiResponse, aiService } = lastMessage;
      // Get original URL from AI response
      const { citationUrl: originalCitationUrl, confidenceRating } = parseAIResponse(aiResponse, aiService);

      // Get validated URL from checkedCitations
      const lastIndex = messages.length - 1;
      const validationResult = checkedCitations[lastIndex];
      const finalCitationUrl = validationResult?.url || validationResult?.fallbackUrl;

      // Get the user's message (which should be the second-to-last message)
      const userMessage = messages[messages.length - 2];
      if (userMessage && userMessage.sender === 'user') {
        // Only log if there's feedback
        logInteraction(
          userMessage.redactedText,
          aiResponse,
          aiService,
          userMessage.referringUrl,
          finalCitationUrl,
          originalCitationUrl,
          confidenceRating,
          feedback,
          expertFeedback
        );
      }
    }
  }, [messages, checkedCitations, logInteraction, parseAIResponse]);

  const handleReferringUrlChange = (e) => {
    const url = e.target.value.trim();
    console.log('Referring URL changed:', url);
    setReferringUrl(url);
  };

  const handleReload = () => {
    window.location.reload();
  };

  // Define the failover order for each AI service
  const getNextAIService = (currentAI) => {
    const failoverOrder = {
      'claude': 'chatgpt',
      'chatgpt': 'cohere',
      'cohere': 'claude'
    };
    return failoverOrder[currentAI];
  };

  const tryAIService = async (aiType, messageWithUrl, conversationHistory, lang) => {
    switch(aiType) {
      case 'claude':
        return await ClaudeService.sendMessage(messageWithUrl, conversationHistory, lang);
      case 'chatgpt':
        return await ChatGPTService.sendMessage(messageWithUrl, conversationHistory, lang);
      case 'cohere':
        return await CohereService.sendMessage(messageWithUrl, conversationHistory, lang);
      default:
        throw new Error('Invalid AI service');
    }
  };

  const addMessage = useCallback((messageData) => {
    const messageId = messageIdCounter.current++;
    setMessages(prev => [...prev, { ...messageData, id: messageId }]);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (inputText.trim() !== '') {
      // Add console log to check referringUrl
      console.log('Referring URL before sending message:', referringUrl);

      if (inputText.length > MAX_CHAR_LIMIT) {
        setMessages(prevMessages => [
          ...prevMessages,
          { 
            text: t('homepage.chat.messages.characterLimit'),
            sender: 'system',
            error: true
          }
        ]);
        return;
      }

      if (turnCount >= MAX_CONVERSATION_TURNS) {
        return;
      }

      setShowFeedback(false);
      const userMessage = inputText.trim();
      const { redactedText, redactedItems } = RedactionService.redactText(userMessage);

      // Check for any blocked content by looking for three or more consecutive '#' symbols
      const hasBlockedContent = redactedText.includes('###');

      // If message contains blocked content, add rejection message and return
      if (hasBlockedContent) {
        setMessages(prevMessages => [
          ...prevMessages,
          { 
            text: redactedText,
            redactedText: redactedText,
            redactedItems: redactedItems,
            sender: 'user'
          },
          { 
            text: t('homepage.chat.messages.blockedContent'),
            sender: 'system',
            error: true
          }
        ]);
        clearInput();
        return;
      }

      // Add message to chat history
      addMessage({
        text: userMessage,
        redactedText: redactedText,
        redactedItems: redactedItems,
        sender: 'user',
        ...(referringUrl.trim() && { referringUrl: referringUrl.trim() })
      });

      clearInput();

      // Continue with normal AI processing if no profanity/threats
      setIsLoading(true);
      try {
        // Add referring URL to the message if provided
        const messageWithUrl = referringUrl
          ? `${redactedText}\n<referring-url>${referringUrl}</referring-url>`
          : redactedText;

        // console.log('Full message being sent:', {
        //   messageWithUrl,
        //   referringUrl: referringUrl.trim(),
        //   conversationHistory
        // });

        // Create conversation history
        const conversationHistory = messages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.sender === 'user' ? msg.redactedText : msg.text
        }));

        let response;
        let usedAI = selectedAI;

        try {
          response = await tryAIService(selectedAI, messageWithUrl, conversationHistory, lang);
          console.log('Raw AI response:', response);
          
          // Remove this addMessage call since we'll add it after URL validation
          // addMessage({
          //   text: response,
          //   sender: 'ai',
          //   aiService: usedAI
          // });
          
          setShowFeedback(true);
        } catch (error) {
          console.error(`Error with ${selectedAI}:`, error);
          
          // Show "thinking more" message
          addMessage({
            text: t('homepage.chat.messages.thinkingMore'),
            sender: 'system'
          });

          // Try next service in the failover chain
          usedAI = getNextAIService(selectedAI);
          try {
            response = await tryAIService(usedAI, messageWithUrl, conversationHistory, lang);
            console.log('Raw AI response:', response);
          } catch (secondError) {
            console.error(`Error with ${usedAI}:`, secondError);
            
            // Try the final service in the chain
            usedAI = getNextAIService(usedAI);
            response = await tryAIService(usedAI, messageWithUrl, conversationHistory, lang);
          }
        }

        const { citationUrl: originalCitationUrl } = parseAIResponse(response, usedAI);
        
        // Create a new message ID before adding the message
        const newMessageId = messageIdCounter.current++;
        
        // Validate URL if present
        let finalCitationUrl, confidenceRating;
        if (originalCitationUrl) {
          const validationResult = await urlValidator.validateAndCheckUrl(originalCitationUrl, lang, t);
          
          // Store validation result in checkedCitations using the new message ID
          setCheckedCitations(prev => ({
            ...prev,
            [newMessageId]: {
              url: validationResult?.url,
              fallbackUrl: validationResult?.fallbackUrl,
              confidenceRating: validationResult?.confidenceRating || '0.1',
              finalCitationUrl: validationResult?.url || validationResult?.fallbackUrl
            }
          }));

          finalCitationUrl = validationResult?.url || validationResult?.fallbackUrl;
          confidenceRating = validationResult?.confidenceRating || '0.1';
        }

        // Always log interaction for all response types (normal, not-gc, pt-muni, question)
        logInteraction(
          redactedText,
          response,
          usedAI,
          referringUrl.trim() || undefined,
          finalCitationUrl,
          originalCitationUrl,
          confidenceRating,
          undefined,
          undefined
        );

        // Add message with the new ID
        setMessages(prev => [...prev, {
          id: newMessageId,
          text: response,
          sender: 'ai',
          aiService: usedAI
        }]);
        
        setShowFeedback(true);

        setTurnCount(prevCount => prevCount + 1);

      } catch (error) {
        console.error('Error sending message:', error);
        setMessages(prevMessages => [
          ...prevMessages,
          { text: t('homepage.chat.messages.error'), sender: 'system', error: true }
        ]);
      } finally {
        setIsLoading(false);
      }
    }
  }, [inputText, referringUrl, turnCount, addMessage, clearInput, t, messages, selectedAI, parseAIResponse, lang, logInteraction]);

  useEffect(() => {
    if (!isLoading && messages.length > 0 && messages[messages.length - 1].sender === 'ai') {
      clearInput();
    }
  }, [isLoading, messages, clearInput]);

  // Memoize the parsed responses with better message tracking
  const parsedResponses = useMemo(() => {
    if (isTyping.current) return {};

    const responses = {};
    const processedIds = new Set(); // Track which messages we've processed

    messages.forEach((message) => {
      if (message.sender === 'ai' && !processedIds.has(message.id)) {
        processedIds.add(message.id);
        console.log(`Parsing message ${message.id}:`, message.text.substring(0, 100) + '...');
        
        const { responseType, content } = parseMessageContent(message.text);
        const { paragraphs, citationHead } = parseAIResponse(content, message.aiService);
        
        responses[message.id] = {
          responseType,
          paragraphs,
          citationHead,
          aiService: message.aiService
        };
      }
    });
    return responses;
  }, [messages, parseAIResponse]);

  const formatAIResponse = useCallback((text, aiService, messageId) => {
    if (!isTyping.current) {
      console.log('Formatting message:', messageId);
    }
    
    const parsedResponse = parsedResponses[messageId];
    if (!parsedResponse) return null;
    
    const citationResult = checkedCitations[messageId];
    const displayUrl = citationResult?.finalCitationUrl || citationResult?.url || citationResult?.fallbackUrl;
    const finalConfidenceRating = citationResult ? citationResult.confidenceRating : '0.1';

    return (
      <div className="ai-message-content">
        {parsedResponse.paragraphs.map((paragraph, index) => {
          const sentences = extractSentences(paragraph);
          return sentences.map((sentence, sentenceIndex) => (
            <p key={`${messageId}-${index}-${sentenceIndex}`} className="ai-sentence">
              {sentence}
            </p>
          ));
        })}
        {parsedResponse.responseType === 'normal' && (parsedResponse.citationHead || displayUrl || aiService) && (
          <div className="citation-container">
            {parsedResponse.citationHead && <p className="citation-head">{parsedResponse.citationHead}</p>}
            {displayUrl && (
              <p className="citation-link">
                <a href={displayUrl} target="_blank" rel="noopener noreferrer">
                  {displayUrl}
                </a>
              </p>
            )}
            <p className="confidence-rating">
              {finalConfidenceRating !== undefined && `${t('homepage.chat.citation.confidence')} ${finalConfidenceRating}`}
              {finalConfidenceRating !== undefined && aiService && ' | '}
              {aiService && `${t('homepage.chat.citation.ai')} ${aiService}`}
            </p>
          </div>
        )}
      </div>
    );
  }, [parsedResponses, checkedCitations, t]);

  const privacyMessage = t('homepage.chat.messages.privacy');

  const getLabelForInput = () => {
    if (turnCount >= 1) {
      return t('homepage.chat.input.followUp');
    }
    return t('homepage.chat.input.initial');
  };

  return (
    <div className="chat-container">
      <div className="message-list">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.sender}`}>
            {message.sender === 'user' ? (
              <div className={`user-message-box ${message.redactedItems && message.redactedItems.length > 0 ? 'redacted-box' : ''}`}>
                <p className={message.redactedItems && message.redactedItems.length > 0 ? "redacted-message" : ""}>
                  {message.redactedText}
                </p>
                {message.redactedItems && message.redactedItems.length > 0 && (
                  <>
                    {message.redactedText.includes('XXX') && (
                      <p className="redacted-preview">{privacyMessage}</p>
                    )}
                    {message.redactedText.includes('###') && (
                      <p className="redacted-preview">{t('homepage.chat.messages.blockedMessage')}</p>
                    )}
                  </>
                )}
              </div>
            ) : (
              <>
                {message.error ? (
                  <div className="error-message">{message.text}</div>
                ) : (
                  formatAIResponse(message.text, message.aiService, message.id)
                )}
                {message.id === messages.length - 1 && 
                 showFeedback && 
                 !message.error && 
                 !message.text.includes('<clarifying-question>') && (
                  <FeedbackComponent onFeedback={handleFeedback} lang={lang} />
                )}
              </>
            )}
          </div>
        ))}
        {isLoading && <div className="message ai">{t('homepage.chat.messages.thinking')}</div>}
        {turnCount >= MAX_CONVERSATION_TURNS && (
          <div className="message ai">
            <div className="limit-reached-message">
              {t('homepage.chat.messages.limitReached', { count: MAX_CONVERSATION_TURNS })}
              <GcdsButton onClick={handleReload} className="reload-button">
                {t('homepage.chat.buttons.reload')}
              </GcdsButton>
            </div>
          </div>
        )}
      </div>
      {turnCount < MAX_CONVERSATION_TURNS && (
        <div className="input-area mt-400">
          <div className="input-button-wrapper">
            <GcdsTextarea
              key={textareaKey}
              textareaId="textarea-props"
              value={inputText}
              label={getLabelForInput()}
              name="textarea-name"
              rows="2"
              hint={t('homepage.chat.input.hint')}
              onInput={handleInputChange}
              disabled={isLoading}
            />
             <GcdsButton onClick={handleSendMessage} disabled={isLoading} className="send-button">
              {t('homepage.chat.buttons.send')}
            </GcdsButton>
          </div>
          <GcdsDetails detailsTitle={t('homepage.chat.options.title')}>
          <div className="ai-toggle" style={{ marginBottom: '10px' }}>
            <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <legend style={{ marginRight: '10px' }}>{t('homepage.chat.options.aiSelection.label')}</legend>
                <div style={{ display: 'flex', alignItems: 'center', marginRight: '15px' }}>
                  <input
                    type="radio"
                    id="claude"
                    name="ai-selection"
                    value="claude"
                    checked={selectedAI === 'claude'}
                    onChange={handleAIToggle}
                    style={{ marginRight: '5px' }}
                  />
                  <label htmlFor="claude" style={{ marginRight: '15px' }}>{t('homepage.chat.options.aiSelection.claude')}</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginRight: '15px' }}>
                  <input
                    type="radio"
                    id="chatgpt"
                    name="ai-selection"
                    value="chatgpt"
                    checked={selectedAI === 'chatgpt'}
                    onChange={handleAIToggle}
                    style={{ marginRight: '5px' }}
                  />
                  <label htmlFor="chatgpt" style={{ marginRight: '15px' }}>{t('homepage.chat.options.aiSelection.chatgpt')}</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="radio"
                    id="cohere"
                    name="ai-selection"
                    value="cohere"
                    checked={selectedAI === 'cohere'}
                    onChange={handleAIToggle}
                    style={{ marginRight: '5px' }}
                  />
                  <label htmlFor="cohere">{t('homepage.chat.options.aiSelection.cohere')}</label>
                </div>
              </div>
            </fieldset>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="referring-url">{t('homepage.chat.options.referringUrl.label')}</label>
            <input
              id="referring-url"
              type="url"
              value={referringUrl}
              onChange={handleReferringUrlChange}
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '4px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
          </GcdsDetails>

        </div>
      )}
    </div>
  );
};

export default TempChatAppContainer;