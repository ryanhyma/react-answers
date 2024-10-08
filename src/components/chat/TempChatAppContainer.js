import React, { useState, useEffect } from 'react';
import ClaudeService from '../../services/ClaudeService.js';
import RedactionService from '../../services/RedactionService.js';
import { GcdsTextarea, GcdsButton} from '@cdssnc/gcds-components-react';
import './TempChatAppContainer.css';

const TempChatAppContainer = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [textareaKey, setTextareaKey] = useState(0);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const clearInput = () => {
    setInputText('');
    setTextareaKey(prevKey => prevKey + 1);
  };

  const parseAIResponse = (text) => {
    const citationHeadRegex = /<citation-head>(.*?)<\/citation-head>/;
    const citationUrlRegex = /<citation-url>(.*?)<\/citation-url>/;
    const confidenceRatingRegex = /<confidence>(.*?)<\/confidence>/;
  
    const headMatch = text.match(citationHeadRegex);
    const urlMatch = text.match(citationUrlRegex);
    const confidenceMatch = text.match(confidenceRatingRegex);
  
    let mainContent, citationHead, citationUrl, confidenceRating;
  
    if (urlMatch) {
      mainContent = text
        .replace(citationHeadRegex, '')
        .replace(citationUrlRegex, '')
        .replace(confidenceRatingRegex, '')
        .trim();
      citationHead = headMatch ? headMatch[1] : null;
      citationUrl = urlMatch[1];
      confidenceRating = confidenceMatch ? confidenceMatch[1] : null;
    } else {
      mainContent = text;
      citationHead = null;
      citationUrl = null;
      confidenceRating = null;
    }
  
    // Split content into paragraphs
    const paragraphs = mainContent.split(/\n+/);
  
    return { paragraphs, citationHead, citationUrl, confidenceRating };
  };
  

  const logInteraction = (originalQuestion, redactedQuestion, aiResponse) => {
    const { paragraphs, citationHead, citationUrl, confidenceRating } = parseAIResponse(aiResponse);
  
    const logEntry = {
      timestamp: new Date().toISOString(),
      originalQuestion,
      redactedQuestion,
      aiResponse: {
        paragraphs,
        citationHead,
        citationUrl,
        confidenceRating
      }
    };
  
    // Log to console
    console.log('Chat Interaction:', logEntry);
  
    // Store in localStorage
    const storedLogs = JSON.parse(localStorage.getItem('chatLogs') || '[]');
    storedLogs.push(logEntry);
    localStorage.setItem('chatLogs', JSON.stringify(storedLogs));
  };

  const handleSendMessage = async () => {
    if (inputText.trim() !== '') {
      const userMessage = inputText.trim();
      const { redactedText, redactedItems } = RedactionService.redactText(userMessage);

      setMessages(prevMessages => [...prevMessages, {
        text: userMessage,
        redactedText: redactedText,
        redactedItems: redactedItems,
        sender: 'user'
      }]);
      clearInput();
      setIsLoading(true);

      try {
        const response = await ClaudeService.sendMessage(redactedText);
        setMessages(prevMessages => [...prevMessages, { text: response, sender: 'ai' }]);

        // Log the interaction
        logInteraction(userMessage, redactedText, response);
      } catch (error) {
        console.error('Error sending message:', error);
        setMessages(prevMessages => [...prevMessages, { text: "Sorry, I couldn't process your request. Please try again later.", sender: 'ai' }]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!isLoading && messages.length > 0 && messages[messages.length - 1].sender === 'ai') {
      clearInput();
    }
  }, [isLoading, messages]);

  const formatAIResponse = (text) => {
    const { paragraphs, citationHead, citationUrl, confidenceRating } = parseAIResponse(text);
  
    return (
      <div className="ai-message-content">
        {paragraphs.map((paragraph, index) => {
          // Check if the paragraph is part of a numbered list
          const listItemMatch = paragraph.match(/^(\d+\.)\s*(.*)/);
          if (listItemMatch) {
            return (
              <p key={index} className="ai-list-item">
                <span className="list-number">{listItemMatch[1]}</span> {listItemMatch[2]}
              </p>
            );
          } else {
            return <p key={index} className="ai-paragraph">{paragraph}</p>;
          }
        })}
        {(citationHead || citationUrl || confidenceRating) && (
          <div className="citation-container">
            {citationHead && <p className="citation-head">{citationHead}</p>}
            {citationUrl && (
              <p className="citation-link">
                <a href={citationUrl} target="_blank" rel="noopener noreferrer">
                  {citationUrl}
                </a>
              </p>
            )}
            {confidenceRating && <p className="confidence-rating">Confidence rating: {confidenceRating}</p>}
          </div>
        )}
      </div>
    );
  };
  

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
              formatAIResponse(message.text)
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
        <GcdsButton onClick={handleSendMessage} disabled={isLoading}>Send</GcdsButton>
      </div>
    </div>
  );
};

export default TempChatAppContainer;