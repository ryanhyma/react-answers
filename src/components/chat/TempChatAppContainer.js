import React, { useState, useRef} from 'react';
import ClaudeService from '../../services/ClaudeService.js';
import { GcdsTextarea, GcdsButton } from '@cdssnc/gcds-components-react';

const TempChatAppContainer = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef(null);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };
  const clearInput = () => {
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    if (inputText.trim() !== '') {
      setMessages([...messages, { text: inputText, sender: 'user' }]);
      clearInput();
      setIsLoading(true);

      try {
        const response = await ClaudeService.sendMessage(inputText);
        setMessages(prevMessages => [...prevMessages, { text: response, sender: 'ai' }]);
      } catch (error) {
        console.error('Error sending message:', error);
        setMessages(prevMessages => [...prevMessages, { text: "Sorry, I couldn't process your request. Please try again later.", sender: 'ai' }]);
      } finally {
        setIsLoading(false);
        clearInput(); // Clear input again after response, just in case
      }
    }
  };

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
          textareaId="textarea-props"
          value={inputText}
          label="Ask a Canada.ca question"
          name="textarea-name"
          rows="2"
          hint="Hint: add details about your situation"
          onInput={handleInputChange}
          disabled={isLoading}
          ref={textareaRef}
        >
        </GcdsTextarea>
        <GcdsButton onClick={handleSendMessage} disabled={isLoading}>Send</GcdsButton>
      </div>
    </div>
  );
};

export default TempChatAppContainer;