import React, { useState, useEffect, useCallback } from 'react';
import ClaudeService from '../../services/ClaudeService.js';
import ChatGPTService from '../../services/ChatGPTService.js';
import RedactionService from '../../services/RedactionService.js';
import FeedbackComponent from './FeedbackComponent';
import LoggingService from '../../services/LoggingService.js';
import { GcdsTextarea, GcdsButton, GcdsInput, GcdsDetails } from '@cdssnc/gcds-components-react';
import '../../styles/TempChatAppContainer.css';
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
      LoggingService.logInteraction(logEntry, false); // false indicates this is not an evaluation
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

      // Create conversation history
      const conversationHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.sender === 'user' ? msg.redactedText : msg.text
      }));

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
          response = await ClaudeService.sendMessage(messageWithUrl, conversationHistory);
        } else {
          response = await ChatGPTService.sendMessage(messageWithUrl, conversationHistory);
        }

        setMessages(prevMessages => [...prevMessages, { text: response, sender: 'ai', aiService: selectedAI }]);
        setShowFeedback(true);

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
  }, [inputText, selectedAI, clearInput, logInteraction, referringUrl, messages]);

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

    // Check for special response types and remove tags anywhere in the content
    if (content.includes('<not-gc>') && content.includes('</not-gc>')) {
      responseType = 'not-gc';
      content = content.replace(/<not-gc>/g, '').replace(/<\/not-gc>/g, '').trim();
    } 
    if (content.includes('<pt-muni>') && content.includes('</pt-muni>')) {
      responseType = 'pt-muni';
      content = content.replace(/<pt-muni>/g, '').replace(/<\/pt-muni>/g, '').trim();
    }
    if (content.includes('<clarifying-question>') && content.includes('</clarifying-question>')) {
      responseType = 'question';
      content = content.replace(/<clarifying-question>/g, '').replace(/<\/clarifying-question>/g, '').trim();
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
        {responseType === 'normal' && (citationHead || citationUrl || aiService) && (
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
              {finalConfidenceRating !== undefined && `Confidence: ${finalConfidenceRating}`}
              {finalConfidenceRating !== undefined && aiService && ' | '}
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
                {index === messages.length - 1 && 
                 showFeedback && 
                 !message.error && 
                 !message.text.includes('<clarifying-question>') && (
                  <FeedbackComponent onFeedback={handleFeedback} />
                )}
              </>
            )}
          </div>
        ))}
        {isLoading && <div className="message ai">Thinking...</div>}
      </div>
      <div className="input-area mt-400">
        <div className="input-button-wrapper">
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
           <GcdsButton onClick={handleSendMessage} disabled={isLoading} className="send-button">
            Send
          </GcdsButton>
        </div>
        <GcdsDetails detailsTitle='Options'>
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
                <label htmlFor="claude" style={{ marginRight: '15px' }}>Anthropic Claude 3.5 Sonnet</label>
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
                <label htmlFor="chatgpt">OpenAI ChatGPT 4o</label>
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
        </GcdsDetails>

      </div>
    </div>
  );
};

export default TempChatAppContainer;