import React, { useState } from 'react';

const ChatAppContainer = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleSendMessage = () => {
    if (inputText.trim() !== '') {
      setMessages([...messages, { text: inputText, sender: 'user' }]);
      setInputText('');
      // Here you would typically call your AI service
      // For now, we'll just simulate a response
      setTimeout(() => {
        setMessages(prevMessages => [...prevMessages, { text: "This is a simulated AI response.", sender: 'ai' }]);
      }, 1000);
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
      </div>
      <div className="input-area">
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Ask a Canada.ca question"
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatAppContainer;