import React, { useState, useEffect } from 'react';
import ClaudeService from '../../services/ClaudeService.js';
import RedactionService from '../../services/RedactionService.js';
import { GcdsTextarea, GcdsButton } from '@cdssnc/gcds-components-react';
import './TempChatAppContainer.css'; // Import the CSS file for styling

const TempChatAppContainer = () => {
  // State variables
  const [messages, setMessages] = useState([]); // Stores all chat messages
  const [inputText, setInputText] = useState(''); // Stores current input text
  const [isLoading, setIsLoading] = useState(false); // Indicates if waiting for AI response
  const [textareaKey, setTextareaKey] = useState(0); // Used to force re-render of textarea

  // Handler for input changes in the textarea
  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  // Function to clear input and force textarea re-render
  const clearInput = () => {
    setInputText('');
    setTextareaKey(prevKey => prevKey + 1); // Incrementing key forces re-render
  };

  // Function to handle sending a message
  const handleSendMessage = async () => {
    if (inputText.trim() !== '') {
      const userMessage = inputText.trim();
      const { redactedText, redactedItems } = RedactionService.redactText(userMessage);

      // Add user message to the chat
      setMessages(prevMessages => [...prevMessages, {
        text: userMessage,
        redactedText: redactedText,
        redactedItems: redactedItems,
        sender: 'user'
      }]);
      clearInput();
      setIsLoading(true);

      try {
        // Send redacted message to Claude and get response
        const response = await ClaudeService.sendMessage(redactedText);
        // Add Claude's response to the chat
        setMessages(prevMessages => [...prevMessages, { text: response, sender: 'ai' }]);
      } catch (error) {
        console.error('Error sending message:', error);
        setMessages(prevMessages => [...prevMessages, { text: "Sorry, I couldn't process your request. Please try again later.", sender: 'ai' }]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Effect to clear input after Claude responds
  useEffect(() => {
    if (!isLoading && messages.length > 0 && messages[messages.length - 1].sender === 'ai') {
      clearInput();
    }
  }, [isLoading, messages]);

  const formatAIResponse = (text) => {
    // Regular expressions for matching citation head and URL
    const citationHeadRegex = /<citation-head>(.*?)<\/citation-head>/;
    const citationUrlRegex = /<citation-url>(.*?)<\/citation-url>/;
  
    // Extract citation head and URL if present
    const headMatch = text.match(citationHeadRegex);
    const urlMatch = text.match(citationUrlRegex);
  
    let mainContent, citationHead, citationUrl;
  
    if (headMatch && urlMatch) {
      // Remove the citation head and URL from the main content
      mainContent = text.replace(citationHeadRegex, '').replace(citationUrlRegex, '').trim();
      citationHead = headMatch[1];
      citationUrl = urlMatch[1];
    } else {
      mainContent = text;
    }
  
    // Split the main content into sentences
    const sentences = mainContent.split(/(?<=[.!?])\s+/);
  
    return (
      <div className="ai-message-content">
        {sentences.map((sentence, index) => (
          <p key={index} className="ai-sentence">{sentence}</p>
        ))}
        {citationHead && citationUrl && (
          <>
            <p className="citation-head">{citationHead}</p>
            <p className="citation-link">
              <a href={citationUrl} target="_blank" rel="noopener noreferrer">
                {citationUrl}
              </a>
            </p>
          </>
        )}
      </div>
    );
  };

  const privacyMessage = "To protect your privacy, personal details were replaced with XXX.";

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
          hint="Hint: add details about your situation and check your answer."
          onInput={handleInputChange}
          disabled={isLoading}
        />
        <GcdsButton onClick={handleSendMessage} disabled={isLoading}>Send</GcdsButton>
      </div>
    </div>
  );
};
export default TempChatAppContainer;