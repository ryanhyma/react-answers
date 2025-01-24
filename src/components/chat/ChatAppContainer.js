import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import '../../styles/App.css';
import { useTranslations } from '../../hooks/useTranslations.js';
import { usePageContext, DEPARTMENT_MAPPINGS } from '../../hooks/usePageParam.js';
import ChatInterface from './ChatInterface.js';
import { parseMessageContent, parsedResponses } from '../../utils/responseMessageParser.js';
import { ChatPipelineService, RedactionError } from '../../services/PipelineService.js';
import { DataStoreService } from '../../services/DataStoreService.js';

const statusMessages = {
  redacting: 'Checking message...',
  searching: 'Searching for relevant information...',
  gettingContext: 'Understanding context...',
  generatingAnswer: 'Generating response...',
  complete: 'Response ready',
  error: 'An error occurred',
  verifyingCitation: "Verifying citation URL",
  updatingDatastore: 'Updating datastore',
  moderatingAnswer: 'Moderating answer',
};

// Utility functions go here, before the component
const extractSentences = (paragraph) => {
  const sentenceRegex = /<s-?\d+>(.*?)<\/s-?\d+>/g;
  const sentences = [];
  let match;
  while ((match = sentenceRegex.exec(paragraph)) !== null) {
    sentences.push(match[1].trim());
  }
  return sentences.length > 0 ? sentences : [paragraph];
};




const ChatAppContainer = ({ lang = 'en', chatId }) => {
  const { t } = useTranslations(lang);
  const { url: pageUrl, department: urlDepartment } = usePageContext();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [textareaKey, setTextareaKey] = useState(0);
  const [selectedAI, setSelectedAI] = useState('chatgpt'); //Changed from on Jan 10 2025
  const [showFeedback, setShowFeedback] = useState(false);
  const [checkedCitations, setCheckedCitations] = useState({});
  const [referringUrl, setReferringUrl] = useState(pageUrl || '');
  const [selectedDepartment, setSelectedDepartment] = useState(urlDepartment || '');
  const MAX_CONVERSATION_TURNS = 3;
  const [turnCount, setTurnCount] = useState(0);
  const MAX_CHAR_LIMIT = 400;
  const messageIdCounter = useRef(0);
  const [displayStatus, setDisplayStatus] = useState('startingToThink');
  const [currentDepartment, setCurrentDepartment] = useState('');
  const [currentTopic, setCurrentTopic] = useState('');
  const [currentSearchResults, setCurrentSearchResults] = useState('');
  const [currentDepartmentUrl, setCurrentDepartmentUrl] = useState('');
  const [currentTopicUrl, setCurrentTopicUrl] = useState('');

  // Add a ref to track if we're currently typing
  const isTyping = useRef(false);

  const handleInputChange = (e) => {
    isTyping.current = true;
    setInputText(e.target.value);
    // Reset typing state after a short delay
    setTimeout(() => {
      isTyping.current = false;
    }, 100);
  };

  const handleAIToggle = (e) => {
    setSelectedAI(e.target.value);
    console.log('AI toggled to:', e.target.value); // Add this line for debugging
  };

  const clearInput = useCallback(() => {
    setInputText('');
    setTextareaKey(prevKey => prevKey + 1);
  }, []);

  const handleFeedback = useCallback((isPositive, expertFeedback = null) => {
    DataStoreService.persistFeedback(isPositive, expertFeedback);
  }, [messages, referringUrl]);

  const handleReferringUrlChange = (e) => {
    const url = e.target.value.trim();
    console.log('Referring URL changed:', url);
    setReferringUrl(url);

    // Parse department from manually entered URL
    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/').filter(Boolean);

      // Find matching department
      let newDepartment = '';
      for (const segment of pathSegments) {
        for (const [, value] of Object.entries(DEPARTMENT_MAPPINGS)) {
          if (segment === value.en || segment === value.fr) {
            newDepartment = value.code;
            break;
          }
        }
        if (newDepartment) break;
      }

      // Update department if found, otherwise keep existing
      if (newDepartment) {
        setSelectedDepartment(newDepartment);
      }
    } catch (error) {
      // If URL is invalid or incomplete, don't change the department
      console.log('Invalid URL format:', error);
    }
  };

  const handleReload = () => {
    window.location.reload();
  };


  const handleSendMessage = useCallback(async () => {
    if (inputText.trim() !== '' && !isLoading) {

      setIsLoading(true);

      // Initial validation checks
      if (inputText.length > MAX_CHAR_LIMIT) {
        const errorMessageId = messageIdCounter.current++;
        setMessages(prevMessages => [
          ...prevMessages,
          {
            id: errorMessageId,
            text: t('homepage.chat.messages.characterLimit'),
            sender: 'system',
            error: true
          }
        ]);
        return;
      }

      // Get conversation history for context
      const conversationHistory = messages
        .filter(m => !m.temporary)
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        }));


      const userMessage = inputText.trim();
      try {
        const interaction = await ChatPipelineService.processMessage(chatId,userMessage, conversationHistory, lang, selectedDepartment, referringUrl, selectedAI, t, (status) => { setDisplayStatus(status); });
        // Now that message is validated and redacted, show formatted message with "Starting to think..."
        const userMessageId = messageIdCounter.current++;

        // TODO - Why set redacted messages if nothing was redacted?
        /*setMessages(prevMessages => [
          ...prevMessages,
          {
            id: userMessageId,
            text: userMessage,
            redactedText: answer.redactedText,
            redactedItems: answer.redactedItems,
            sender: 'user',
            ...(referringUrl.trim() && { referringUrl: referringUrl.trim() })
          }
        ]);*/

        clearInput();

        // Add the AI response to messages
        setMessages(prev => [...prev, {
          id: interaction.answer.answerId,
          text: interaction.answer.text,
          sender: 'ai',
          aiService: interaction.answer.provider,
          department: interaction.context.department
        }]);

        setTurnCount(prev => prev + 1);
        setShowFeedback(true);
        setIsLoading(false);


      } catch (error) {
        if (error instanceof RedactionError) {

          const userMessageId = messageIdCounter.current++;
          const blockedMessageId = messageIdCounter.current++;
          setMessages(prevMessages => [
            ...prevMessages,
            {
              id: userMessageId,
              text: error.redactedText,
              redactedText: error.redactedText,
              redactedItems: error.redactedItems,
              sender: 'user'
            },
            {
              id: blockedMessageId,
              text: <div dangerouslySetInnerHTML={{
                __html: '<i class="fa-solid fa-circle-exclamation"></i>' +
                  (error.redactedText.includes('XXX') ? t('homepage.chat.messages.privateContent') : t('homepage.chat.messages.blockedContent'))
              }} />,
              sender: 'system',
              error: true
            }
          ]);
          clearInput();
          return;
        } else {
          console.error('Error in handleSendMessage:', error);
          const errorMessageId = messageIdCounter.current++;
          setMessages(prevMessages => [
            ...prevMessages,
            {
              id: errorMessageId,
              text: t('homepage.chat.messages.error'),
              sender: 'system',
              error: true
            }
          ]);
        }
      }

    }




  }, [
    inputText,
    referringUrl,
    selectedAI,
    lang,
    t,
    clearInput,
    selectedDepartment,
    isLoading,
    messages,
    turnCount,
    currentDepartment,
    currentDepartmentUrl,
    currentSearchResults,
    currentTopic,
    currentTopicUrl
  ]);

  useEffect(() => {
    if (pageUrl && !referringUrl) {
      setReferringUrl(pageUrl);
    }

    if (urlDepartment && !selectedDepartment) {
      setSelectedDepartment(urlDepartment);
    }
  }, [pageUrl, urlDepartment, referringUrl, selectedDepartment]);



  const formatAIResponse = useCallback((text, aiService, messageId) => {
    if (!isTyping.current && messageId !== undefined) {
      // console.log('Formatting message:', messageId);
    }

    const parsedResponse = parsedResponses[messageId];
    if (!parsedResponse) return null;

    // Clean up any instruction tags from the paragraphs
    if (parsedResponse.paragraphs) {
      parsedResponse.paragraphs = parsedResponse.paragraphs.map(paragraph =>
        paragraph.replace(/<translated-question>.*?<\/translated-question>/g, '')
      );
    }

    const citationResult = checkedCitations[messageId];
    const displayUrl = citationResult?.finalCitationUrl || citationResult?.url || citationResult?.fallbackUrl;
    const finalConfidenceRating = citationResult ? citationResult.confidenceRating : '0.1';

    // Find the message to get its department
    const message = messages.find(m => m.id === messageId);
    const messageDepartment = message?.department || selectedDepartment;

    return (
      <div className="ai-message-content">
        {parsedResponse.paragraphs.map((paragraph, index) => {
          const sentences = extractSentences(paragraph);
          return sentences.map((sentence, sentenceIndex) => (
            <p key={`${messageId}-p${index}-s${sentenceIndex}`} className="ai-sentence">
              {sentence}
            </p>
          ));
        })}
        {parsedResponse.responseType === 'normal' && (parsedResponse.citationHead || displayUrl) && (
          <div className="citation-container">
            {parsedResponse.citationHead && <p key={`${messageId}-head`} className="citation-head">{parsedResponse.citationHead}</p>}
            {displayUrl && (
              <p key={`${messageId}-link`} className="citation-link">
                <a href={displayUrl} target="_blank" rel="noopener noreferrer">
                  {displayUrl}
                </a>
              </p>
            )}
            <p key={`${messageId}-confidence`} className="confidence-rating">
              {finalConfidenceRating !== undefined && `${t('homepage.chat.citation.confidence')} ${finalConfidenceRating}`}
              {finalConfidenceRating !== undefined && (aiService || messageDepartment) && ' | '}
              {aiService && `${t('homepage.chat.citation.ai')} ${aiService}`}
              {messageDepartment && ` | ${messageDepartment}`}
            </p>
          </div>
        )}
      </div>
    );
  }, [parsedResponses, checkedCitations, t, selectedDepartment, messages]);

  // Add handler for department changes
  const handleDepartmentChange = (department) => {
    setSelectedDepartment(department);
  };

  return (
    <ChatInterface
      messages={messages}
      inputText={inputText}
      isLoading={isLoading}
      textareaKey={textareaKey}
      handleInputChange={handleInputChange}
      handleSendMessage={handleSendMessage}
      handleReload={handleReload}
      handleAIToggle={handleAIToggle}
      handleDepartmentChange={handleDepartmentChange}
      handleReferringUrlChange={handleReferringUrlChange}
      handleFeedback={handleFeedback}
      formatAIResponse={formatAIResponse}
      selectedAI={selectedAI}
      selectedDepartment={selectedDepartment}
      referringUrl={referringUrl}
      turnCount={turnCount}
      showFeedback={showFeedback}
      displayStatus={displayStatus}
      currentDepartment={currentDepartment}
      currentTopic={currentTopic}
      currentSearchResults={currentSearchResults}
      MAX_CONVERSATION_TURNS={MAX_CONVERSATION_TURNS}
      t={t}
      lang={lang}
      privacyMessage={t('homepage.chat.messages.privacy')}
      getLabelForInput={() => turnCount >= 1 ? t('homepage.chat.input.followUp') : t('homepage.chat.input.initial')}
      extractSentences={extractSentences}
      parsedResponses={parsedResponses}
      checkedCitations={checkedCitations}
      chatId={chatId}
    />
  );
};

export default ChatAppContainer;
