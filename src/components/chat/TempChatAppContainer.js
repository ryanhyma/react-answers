import React, { useState, useEffect, useCallback } from 'react';
import ClaudeService from '../../services/ClaudeService.js';
import ChatGPTService from '../../services/ChatGPTService.js';
import RedactionService from '../../services/RedactionService.js';
import { GcdsTextarea, GcdsButton } from '@cdssnc/gcds-components-react';
import './TempChatAppContainer.css';

const TempChatAppContainer = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [textareaKey, setTextareaKey] = useState(0);
  const [selectedAI, setSelectedAI] = useState('claude');

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
  
    return { paragraphs, citationHead, citationUrl, confidenceRating, aiService };
  }, []);
//end of parseAIResponse

 // wrap log function with useCallback to ensure it's only recreated when necessary
 const logInteraction = useCallback((originalQuestion, redactedQuestion, aiResponse, aiService) => {
  const parsedResponse = parseAIResponse(aiResponse, aiService);

  const logEntry = {
    timestamp: new Date().toISOString(),
    originalQuestion,
    redactedQuestion,
    aiResponse: parsedResponse,
    aiService
  };

  // Log to console
  console.log('Chat Interaction:', logEntry);

  // Store in localStorage
  const storedLogs = JSON.parse(localStorage.getItem('chatLogs') || '[]');
  storedLogs.push(logEntry);
  localStorage.setItem('chatLogs', JSON.stringify(storedLogs));
}, [parseAIResponse]);
//end of logInteraction

const handleSendMessage = useCallback(async () => {
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
      let response;
      console.log('Sending message to:', selectedAI);
      if (selectedAI === 'claude') {
        response = await ClaudeService.sendMessage(redactedText);
      } else {
        response = await ChatGPTService.sendMessage(redactedText);
      }
      setMessages(prevMessages => [...prevMessages, { text: response, sender: 'ai', aiService: selectedAI }]);

      // Log the interaction
      logInteraction(userMessage, redactedText, response, selectedAI);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prevMessages => [...prevMessages, { text: "Sorry, I couldn't process your request. Please try again later.", sender: 'ai' }]);
    } finally {
      setIsLoading(false);
    }
  }
}, [inputText, selectedAI, clearInput, logInteraction]);
// end of handleSendMessage


  useEffect(() => {
    if (!isLoading && messages.length > 0 && messages[messages.length - 1].sender === 'ai') {
      clearInput();
    }
  }, [isLoading, messages, clearInput]);

  //format the response from the AI service
  const formatAIResponse = (text, aiService) => {
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
  
    const { paragraphs, citationHead, citationUrl, confidenceRating } = parseAIResponse(content, aiService);
  
    return (
      <div className="ai-message-content">
        {paragraphs.map((paragraph, index) => {
          // Check if the paragraph contains sentence tags
          const sentenceRegex = /<s-(\d+)>(.*?)<\/s-\1>/g;
          const sentences = [...paragraph.matchAll(sentenceRegex)];
  
          if (sentences.length > 0) {
            // If sentences are tagged, render each sentence separately
            return sentences.map(([, number, sentence], sentenceIndex) => (
              <p key={`${index}-${sentenceIndex}`} className="ai-sentence">
                {sentence.trim()}
              </p>
            ));
          } else {
            // If no sentence tags, check for list items or render as a regular paragraph
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
          }
        })}
        {(citationHead || citationUrl || responseType !== 'normal' || aiService) && (
          <div className="citation-container">
            {citationHead && <p className="citation-head">{citationHead}</p>}
            {citationUrl && (
              <p className="citation-link">
                <a href={citationUrl} target="_blank" rel="noopener noreferrer">
                  {citationUrl}
                </a>
              </p>
            )}
            <p className="confidence-rating">
              {responseType === 'normal' && confidenceRating && `Confidence: ${confidenceRating}`}
              {responseType === 'not-gc' && 'Not-GC'}
              {responseType === 'pt-muni' && 'P-T-Muni'}
              {((responseType === 'normal' && confidenceRating) || responseType !== 'normal') && aiService && ' | '}
              {aiService && `AI: ${aiService}`}
            </p>
          </div>
        )}
      </div>
    );
  }; //end of formatAIResponse

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
              formatAIResponse(message.text, message.aiService)
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
 
        <GcdsButton onClick={handleSendMessage} disabled={isLoading}>Send</GcdsButton>
      </div>
    </div>
  );
};

export default TempChatAppContainer;