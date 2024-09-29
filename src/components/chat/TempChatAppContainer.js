import React, { useState, useEffect } from 'react';
import ClaudeService from '../../services/ClaudeService.js';
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
      // Add user message to the chat
      setMessages(prevMessages => [...prevMessages, { text: userMessage, sender: 'user' }]);
      clearInput();
      setIsLoading(true);

      try {
        // Send message to Claude and get response
        const response = await ClaudeService.sendMessage(userMessage);
        // Add Claude's response to the chat
        setMessages(prevMessages => [...prevMessages, { text: response, sender: 'ai' }]);
      } catch (error) {
        console.error('Error sending message:', error);
        // Add error message to chat if request fails
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
    // Regular expression to match the citation link
    const citationRegex = /(https:\/\/www\.canada\.ca\/[^\s]+)/;
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
        {/* Render all messages */}
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            {message.sender === 'user' ? (
              // Render user message in a styled box
              <div className="user-message-box">
                <p>{message.text}</p>
              </div>
            ) : (
              // Render AI message with formatted text
              formatAIResponse(message.text)
            )}
          </div>
        ))}
        {/* Show loading indicator while waiting for AI response */}
        {isLoading && <div className="message ai">Thinking...</div>}
      </div>
      <div className="input-area mt-400">
        {/* Input textarea for user messages */}
        <GcdsTextarea
          key={textareaKey}
          textareaId="textarea-props"
          value={inputText}
          label="Ask a Canada.ca question"
          name="textarea-name"
          rows="2"
          hint="Hint: add details about your situation and check your answer"
          onInput={handleInputChange}
          disabled={isLoading}
        />
        {/* Send button */}
        <GcdsButton onClick={handleSendMessage} disabled={isLoading}>Send</GcdsButton>
      </div>
    </div>
  );
};

export default TempChatAppContainer;