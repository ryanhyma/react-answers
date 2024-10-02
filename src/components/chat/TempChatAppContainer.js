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

  // Function to format the AI response by splitting into sentences and handling citations
    const formatAIResponse = (text) => {
    // Updated regex to match canada.ca (including subdomains) and gc.ca URLs
    const citationRegex = /(https?:\/\/(?:[a-zA-Z0-9-]+\.)*(?:canada\.ca|gc\.ca)\/[^\s]+)/;
   
    const citationMatch = text.match(citationRegex);

    let mainContent, citationLink, followUpPrompt;

    if (citationMatch) {
      // Split the text into parts: main content, citation link, and follow-up prompt
      const parts = text.split(citationMatch[0]);
      mainContent = parts[0].trim();
      citationLink = citationMatch[0];
      followUpPrompt = parts[1] ? parts[1].trim() : '';
    } else {
      mainContent = text;
    }

    // Split the main content into sentences
    const sentences = mainContent.split(/(?<=[.!?])\s+/);

    return (
      <div className="ai-message-content">
        {/* Render each sentence as a separate paragraph */}
        {sentences.map((sentence, index) => (
          <p key={index} className="ai-sentence">{sentence}</p>
        ))}
        {/* Render the citation link if it exists */}
        {citationLink && (
          <p className="citation-link">
            <a href={citationLink} target="_blank" rel="noopener noreferrer">
              {citationLink}
            </a>
          </p>
        )}
        {/* Render the follow-up prompt if it exists */}
        {followUpPrompt && <p className="follow-up-prompt">{followUpPrompt}</p>}
      </div>
    );
  };

  return (
    <div className="chat-container">
      <div className="message-list">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            {message.sender === 'user' ? (
              <div className={`user-message-box ${message.redactedItems && message.redactedItems.length > 0 ? 'redacted-box' : ''}`}>
                {message.redactedItems && message.redactedItems.length > 0 ? (
                  <>
                    <p className="redacted-message">{message.redactedText}</p>
                    <p className="redacted-preview">
                      Some personal details were removed to protect your privacy from the AI service.
                    </p>
                  </>
                ) : (
                  <p>{message.text}</p>
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