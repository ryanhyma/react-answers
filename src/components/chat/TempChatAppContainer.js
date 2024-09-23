import React, { useState } from 'react';
import claudeService from '../../services/ClaudeService.js';

const TempChatAppContainer = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleSendMessage = async () => {
    if (inputText.trim() !== '') {
      setMessages([...messages, { text: inputText, sender: 'user' }]);
      setInputText('');
      setIsLoading(true);
      
      try {
        const response = await claudeService.sendMessage(inputText);
        setMessages(prevMessages => [...prevMessages, { text: response, sender: 'ai' }]);
      } catch (error) {
        setMessages(prevMessages => [...prevMessages, { text: "Sorry, I couldn't process your request. Please try again later.", sender: 'ai' }]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="chat-container">
      <div className="message-list">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            {message.text}
          </div>
        ))}
        {isLoading && <div className="message ai">Thinking...</div>}
      </div>
      <div className="input-area">
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Ask a Canada.ca question"
          disabled={isLoading}
        />
        <button onClick={handleSendMessage} disabled={isLoading}>Send</button>
      </div>
    </div>
  );
};

export default TempChatAppContainer;