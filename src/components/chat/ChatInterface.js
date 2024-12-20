import React from 'react';
import { GcdsTextarea, GcdsButton, GcdsDetails } from '@cdssnc/gcds-components-react';
import FeedbackComponent from './FeedbackComponent.js';
import DepartmentSelectorTesting from './DepartmentSelectorTesting.js';

const ChatInterface = ({
  messages,
  inputText,
  isLoading,
  textareaKey,
  handleInputChange,
  handleSendMessage,
  handleReload,
  handleAIToggle,
  handleDepartmentChange,
  handleReferringUrlChange,
  handleFeedback,
  formatAIResponse,
  selectedAI,
  selectedDepartment,
  referringUrl,
  turnCount,
  showFeedback,
  displayStatus,
  currentDepartment,
  currentTopic,
  MAX_CONVERSATION_TURNS,
  t,
  lang,
  parsedResponses,
  extractSentences,
}) => {
  const getLabelForInput = () => {
    if (turnCount >= 1) {
      return t('homepage.chat.input.followUp');
    }
    return t('homepage.chat.input.initial');
  };

  const getLastMessageSentenceCount = () => {
    const lastAiMessage = messages.filter(m => m.sender === 'ai').pop();
    if (lastAiMessage && parsedResponses[lastAiMessage.id]) {
      return parsedResponses[lastAiMessage.id].paragraphs.reduce((count, paragraph) => 
        count + extractSentences(paragraph).length, 0);
    }
    return 1;
  };

  return (
    <div className="chat-container">
    <div className="message-list">
      {messages.map((message) => (
        <div key={`message-${message.id}`} className={`message ${message.sender}`}>
          {message.sender === 'user' ? (
            <div className={`user-message-box ${message.redactedItems?.length > 0 ? 'redacted-box' : ''}`}>
              <p className={message.redactedItems?.length > 0 ? "redacted-message" : ""}>
                {message.redactedText}
              </p>
              {message.redactedItems?.length > 0 && message.redactedText && (
                <p className="redacted-preview">
                  {message.redactedText.includes('XXX') && 
                    t('homepage.chat.messages.privacyMessage')}
                  {message.redactedText.includes('###') && 
                    t('homepage.chat.messages.blockedMessage')}
                </p>
              )}
            </div>
          ) : (
              <>
                {message.error ? (
                  <div className="error-message">{message.text}</div>
                ) : (
                  formatAIResponse(message.text, message.aiService, message.id)
                )}
                {message.id === messages.length - 1 && 
                 showFeedback && 
                 !message.error && 
                 !message.text.includes('<clarifying-question>') && (
                  <FeedbackComponent 
                    onFeedback={handleFeedback}
                    lang={lang}
                    sentenceCount={getLastMessageSentenceCount()}
                  />
                )}
              </>
            )}
          </div>
        ))}
        
      {isLoading && (
        <div key="loading" className="loading-container">
          <div className="loading-animation"></div>
           <div className="loading-text">
               {displayStatus === 'thinkingWithContext' ? 
               `${t('homepage.chat.messages.thinkingWithContext')}: ${currentDepartment} - ${currentTopic}` :
               t(`homepage.chat.messages.${displayStatus}`)
               }
           </div>
       </div>
      )}
        
        {turnCount >= MAX_CONVERSATION_TURNS && (
          <div key="limit-reached" className="message ai">
            <div className="limit-reached-message">
              {t('homepage.chat.messages.limitReached', { count: MAX_CONVERSATION_TURNS })}
              <GcdsButton onClick={handleReload} className="reload-button">
                {t('homepage.chat.buttons.reload')}
              </GcdsButton>
            </div>
          </div>
        )}
      </div>

      {turnCount < MAX_CONVERSATION_TURNS && (
        <div className="input-area mt-200">
          <div className="input-button-wrapper">
            <GcdsTextarea
              key={textareaKey}
              textareaId="textarea-props"
              value={inputText}
              label={getLabelForInput()}
              name="textarea-name"
              rows="2"
              hint={t('homepage.chat.input.hint')}
              onInput={handleInputChange}
              disabled={isLoading}
            />
            <GcdsButton onClick={handleSendMessage} disabled={isLoading} className="send-button">
              {t('homepage.chat.buttons.send')}
            </GcdsButton>
          </div>

          <GcdsDetails detailsTitle={t('homepage.chat.options.title')}>
            <div className="ai-toggle">
              <fieldset className="ai-toggle_fieldset">
                <div className="ai-toggle_container">
                  <legend className="ai-toggle_legend">{t('homepage.chat.options.aiSelection.label')}</legend>
                  <div className="ai-toggle_option">
                    <input
                      type="radio"
                      id="claude"
                      name="ai-selection"
                      value="claude"
                      checked={selectedAI === 'claude'}
                      onChange={handleAIToggle}
                      className="ai-toggle_radio-input"
                    />
                    <label htmlFor="claude">{t('homepage.chat.options.aiSelection.claude')}</label>
                  </div>
                  <div className="ai-toggle_option">
                    <input
                      type="radio"
                      id="chatgpt"
                      name="ai-selection"
                      value="chatgpt"
                      checked={selectedAI === 'chatgpt'}
                      onChange={handleAIToggle}
                      className="ai-toggle_radio-input"
                    />
                    <label htmlFor="chatgpt">{t('homepage.chat.options.aiSelection.chatgpt')}</label>
                  </div>
                  <div className="ai-toggle_option">
                    <input
                      type="radio"
                      id="cohere"
                      name="ai-selection"
                      value="cohere"
                      checked={selectedAI === 'cohere'}
                      onChange={handleAIToggle}
                      className="ai-toggle_radio-input"
                    />
                    <label htmlFor="cohere">{t('homepage.chat.options.aiSelection.cohere')}</label>
                  </div>
                </div>
              </fieldset>
            </div>

            <div className="mrgn-bttm-10">
              <label className="display-block mrgn-bttm-4">Referred from:</label>
              <DepartmentSelectorTesting
                selectedDepartment={selectedDepartment}
                onDepartmentChange={handleDepartmentChange}
                lang={lang}
              />
            </div>

            <div className="mrgn-bttm-10">
              <label htmlFor="referring-url">{t('homepage.chat.options.referringUrl.label')}</label>
              <input
                id="referring-url"
                type="url"
                value={referringUrl}
                onChange={handleReferringUrlChange}
                className="chat-border"
              />
            </div>
          </GcdsDetails>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;