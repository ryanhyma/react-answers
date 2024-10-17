import React, { useState, useEffect, useCallback } from 'react';
import ClaudeService from '../../services/ClaudeService.js';
import ChatGPTService from '../../services/ChatGPTService.js';
import RedactionService from '../../services/RedactionService.js';
import FeedbackComponent from './FeedbackComponent';
import LoggingService from '../../services/LoggingService.js';
import { GcdsTextarea, GcdsButton, GcdsInput } from '@cdssnc/gcds-components-react';
import './TempChatAppContainer.css';
import checkCitationUrl from '../../utils/urlChecker.js';

const TempChatAppContainer = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [textareaKey, setTextareaKey] = useState(0);
  const [selectedAI, setSelectedAI] = useState('claude');
  const [showFeedback, setShowFeedback] = useState(false);
  const [checkedCitations, setCheckedCitations] = useState({});
  const [referringUrl, setReferringUrl] = useState('');

  const handleInputChange = (e) => {
    setInputText(e.target.value);
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

  const logInteraction = useCallback((originalQuestion, redactedQuestion, aiResponse, aiService, referringUrl, citationUrl, confidenceRating, feedback, expertFeedback) => {
    const { citationUrl: originalCitationUrl } = parseAIResponse(aiResponse, aiService);

    const logEntry = {
      originalQuestion,
      redactedQuestion,
      aiResponse,
      aiService,
      ...(referringUrl && { referringUrl }),
      ...(citationUrl && { citationUrl }),
      ...(originalCitationUrl && { originalCitationUrl }),
      ...(confidenceRating && { confidenceRating }),
      ...(feedback !== undefined && { feedback }),
      ...(expertFeedback && { expertFeedback })
    };
    // Log to console in all environments
    console.log('Chat Interaction:', logEntry);
    // Only log to database in production environment
    if (process.env.REACT_APP_ENV === 'production') {
      LoggingService.logInteraction(logEntry);
    }
  }, [parseAIResponse]);

  const handleFeedback = useCallback((isPositive, expertFeedback = null) => {
    const feedback = isPositive ? 'positive' : 'negative';
    console.log(`User feedback: ${feedback}`, expertFeedback);

    // Get the last message (which should be the AI response)
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.sender === 'ai') {
      const { text: aiResponse, aiService } = lastMessage;
      const { citationUrl, confidenceRating } = parseAIResponse(aiResponse, aiService);

      // Get the user's message (which should be the second-to-last message)
      const userMessage = messages[messages.length - 2];
      if (userMessage && userMessage.sender === 'user') {
        logInteraction(
          userMessage.text,
          userMessage.redactedText,
          aiResponse,
          aiService,
          userMessage.referringUrl,
          citationUrl,
          confidenceRating,
          feedback,
          expertFeedback
        );
      }
    }
  }, [messages, logInteraction, parseAIResponse]);

  const handleReferringUrlChange = (e) => {
    setReferringUrl(e.target.value);
  };

  const handleSendMessage = useCallback(async () => {
    if (inputText.trim() !== '') {
      setShowFeedback(false);
      const userMessage = inputText.trim();
      const { redactedText, redactedItems } = RedactionService.redactText(userMessage);

      // Add referring URL to the message if provided
      const messageWithUrl = referringUrl
        ? `${redactedText}\n<referring-url>${referringUrl}</referring-url>`
        : redactedText;

      setMessages(prevMessages => [...prevMessages, {
        text: userMessage,
        redactedText: redactedText,
        redactedItems: redactedItems,
        sender: 'user',
        ...(referringUrl.trim() && { referringUrl: referringUrl.trim() })
      }]);
      clearInput();
      setIsLoading(true);

      try {
        let response;
        if (selectedAI === 'claude') {
          response = await ClaudeService.sendMessage(messageWithUrl);
        } else {
          response = await ChatGPTService.sendMessage(messageWithUrl);
        }

        setMessages(prevMessages => [...prevMessages, { text: response, sender: 'ai', aiService: selectedAI }]);
        setShowFeedback(true);  // Show feedback component after AI response

        // Log the interaction
        logInteraction(
          userMessage,
          redactedText,
          response,
          selectedAI,
          referringUrl.trim() || undefined
        );
      } catch (error) {
        console.error('Error sending message:', error);
        setMessages(prevMessages => [
          ...prevMessages,
          { text: "Sorry, I couldn't process your request. Please try again later.", sender: 'ai', error: true }
        ]);
      } finally {
        setIsLoading(false);
      }
    }
  }, [inputText, selectedAI, clearInput, logInteraction, referringUrl]);

  useEffect(() => {
    if (!isLoading && messages.length > 0 && messages[messages.length - 1].sender === 'ai') {
      clearInput();
    }
  }, [isLoading, messages, clearInput]);

  const checkAndUpdateCitation = useCallback(async (messageIndex, citationUrl) => {
    if (!citationUrl || checkedCitations[messageIndex]) return;

    const result = await checkCitationUrl(citationUrl);
    setCheckedCitations(prev => ({ ...prev, [messageIndex]: result }));
  }, [checkedCitations]);

  useEffect(() => {
    messages.forEach((message, index) => {
      if (message.sender === 'ai') {
        const { citationUrl } = parseAIResponse(message.text, message.aiService);
        if (citationUrl) {
          checkAndUpdateCitation(index, citationUrl);
        }
      }
    });
  }, [messages, checkAndUpdateCitation, parseAIResponse]);

  const formatAIResponse = useCallback((text, aiService, messageIndex) => {
    // console.log('Formatting AI response:', text, aiService, messageIndex);
    let responseType = 'normal';
    let content = text;

    // Check for special response types and remove tags
    if (content.startsWith('<not-gc>') && content.endsWith('</not-gc>')) {
      responseType = 'not-gc';
      content = content.slice(8, -9).trim(); // Remove <not-gc> tags
    } else if (content.startsWith('<pt-muni>') && content.endsWith('</pt-muni>')) {
      responseType = 'pt-muni';
      content = content.slice(9, -10).trim(); // Remove <pt-muni> tags
    }

    const { paragraphs, citationHead, citationUrl, confidenceRating: originalConfidenceRating } = parseAIResponse(content, aiService);
    const citationResult = checkedCitations[messageIndex];

    // Use the checked citation's confidence rating if available, otherwise use the original
    const finalConfidenceRating = citationResult ? citationResult.confidenceRating : originalConfidenceRating;

    // Function to extract sentences from a paragraph
    const extractSentences = (paragraph) => {
      const sentenceRegex = /<s-\d+>(.*?)<\/s-\d+>/g;
      const sentences = [];
      let match;
      while ((match = sentenceRegex.exec(paragraph)) !== null) {
        sentences.push(match[1].trim());
      }
      return sentences.length > 0 ? sentences : [paragraph];
    };

    return (
      <div className="ai-message-content">
        {paragraphs.map((paragraph, index) => {
          const sentences = extractSentences(paragraph);
          return sentences.map((sentence, sentenceIndex) => (
            <p key={`${index}-${sentenceIndex}`} className="ai-sentence">
              {sentence}
            </p>
          ));
        })}
        {(citationHead || citationUrl || responseType !== 'normal' || aiService) && (
          <div className="citation-container">
            {citationHead && <p className="citation-head">{citationHead}</p>}
            {citationUrl && citationResult && (
              <p className="citation-link">
                {citationResult.isValid ? (
                  <a href={citationResult.url} target="_blank" rel="noopener noreferrer">
                    {citationResult.url}
                  </a>
                ) : (
                  <a href={citationResult.fallbackUrl} target="_blank" rel="noopener noreferrer">
                    {citationResult.fallbackText}
                  </a>
                )}
              </p>
            )}
            <p className="confidence-rating">
              {responseType === 'normal' && finalConfidenceRating !== undefined && `Confidence: ${finalConfidenceRating}`}
              {responseType === 'not-gc' && 'Not-GC'}
              {responseType === 'pt-muni' && 'P-T-Muni'}
              {((responseType === 'normal' && finalConfidenceRating !== undefined) || responseType !== 'normal') && aiService && ' | '}
              {aiService && `AI: ${aiService}`}
            </p>
          </div>
        )}
      </div>
    );
  }, [parseAIResponse, checkedCitations]);

  const privacyMessage = "To protect your privacy, personal details were removed and replaced with XXX.";

  return (
    <div className="chat-container">
      <div className="message-list">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            {message.sender === 'user' ? (
              <div className={`user-message-box ${message.redactedItems && message.redactedItems.length > 0 ? 'redacted-box' : ''}`}>
                <p className={message.redactedItems && message.redactedItems.length > 0 ? "redacted-message" : ""}>
                  {message.redactedText}
                </p>
                {message.redactedItems && message.redactedItems.length > 0 && (
                  <p className="redacted-preview">
                    {privacyMessage}
                  </p>
                )}
              </div>
            ) : (
              <>
                {message.error ? (
                  <div className="error-message">{message.text}</div>
                ) : (
                  formatAIResponse(message.text, message.aiService, index)
                )}
                {index === messages.length - 1 && showFeedback && !message.error && (
                  <FeedbackComponent onFeedback={handleFeedback} />
                )}
              </>
            )}
          </div>
        ))}
        {isLoading && <div className="message ai">Thinking...</div>}
      </div>
      <div className="input-area mt-400">
        <GcdsTextarea
          key={textareaKey}
          textareaId="textarea-props"
          value={inputText}
          label="Ask a Canada.ca question"
          name="textarea-name"
          rows="2"
          hint="Hint: add details about your situation. Always check your answer."
          onInput={handleInputChange}
          disabled={isLoading}
        />
        <div className="ai-toggle" style={{ marginBottom: '10px' }}>
          <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <legend style={{ marginRight: '10px' }}>AI:</legend>
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
                <label htmlFor="claude" style={{ marginRight: '15px' }}>Claude</label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="radio"
                  id="chatgpt"
                  name="ai-selection"
                  value="chatgpt"
                  checked={selectedAI === 'chatgpt'}
                  onChange={handleAIToggle}
                  style={{ marginRight: '5px' }}
                />
                <label htmlFor="chatgpt">ChatGPT</label>
              </div>
            </div>
          </fieldset>
        </div>
        <GcdsInput
          label="Referring Canada.ca URL (optional)"
          type="url"
          value={referringUrl}
          onGcdsChange={handleReferringUrlChange}
          style={{ marginBottom: '10px' }}
        />
        <GcdsButton onClick={handleSendMessage} disabled={isLoading}>Send</GcdsButton>
      </div>
    </div>
  );
};

export default TempChatAppContainer;
