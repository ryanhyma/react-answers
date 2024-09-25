import React, { useState, useEffect } from 'react';
import ClaudeService from '../../services/ClaudeService.js';
import { GcdsTextarea, GcdsButton } from '@cdssnc/gcds-components-react';

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
    setTextareaKey(prevKey => prevKey + 1); // Force re-render of textarea
  };

  const handleSendMessage = async () => {
    if (inputText.trim() !== '') {
      const userMessage = inputText.trim();
      setMessages(prevMessages => [...prevMessages, { text: userMessage, sender: 'user' }]);
      clearInput();
      setIsLoading(true);

      try {
        const response = await ClaudeService.sendMessage(userMessage);
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

  return (
    <div className="chat-container">
      <div className="message-list">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            <p>{message.text}</p>
          </div>
        ))}
        {isLoading && <div className="message ai">Thinking...</div>}
      </div>
      <div className="input-area mt-400" >
        <GcdsTextarea
          key={textareaKey}
          textareaId="textarea-props"
          value={inputText}
          label="Ask a Canada.ca question"
          name="textarea-name"
          rows="2"
          hint="Hint: add details about your situation"
          onInput={handleInputChange}
          disabled={isLoading}
        >
        </GcdsTextarea>
        <GcdsButton onClick={handleSendMessage} disabled={isLoading}>Send</GcdsButton>
      </div>
    </div>
  );
};

export default TempChatAppContainer;