// src/pages/HomePage.js
import React, { useState, useEffect } from 'react';
import TempChatAppContainer from '../components/chat/TempChatAppContainer';
import { GcdsContainer, GcdsDetails, GcdsText, GcdsLink } from '@cdssnc/gcds-components-react';
import { useTranslations } from '../hooks/useTranslations';

// Error Boundary remains the same
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const { t } = this.props;
      return (
        <GcdsContainer size="xl" mainContainer centered>
          <h2>{t('homepage.errors.timeout.title')}</h2>
          <GcdsText>{t('homepage.errors.timeout.message')}</GcdsText>
          <button 
            onClick={() => window.location.reload()}
            className="gcds-button gcds-button--primary"
          >
            {t('homepage.errors.timeout.button')}
          </button>
        </GcdsContainer>
      );
    }

    return this.props.children;
  }
}

const HomePage = ({ lang = 'en' }) => {
  const { t } = useTranslations(lang);
  const [serviceStatus, setServiceStatus] = useState(null);

  useEffect(() => {
    // TODO: Replace with actual API call to get status
    const status = {
      isAvailable: true,
      message: t('homepage.errors.serviceUnavailable'),
    };
    setServiceStatus(status);
  }, [t]);

  // Wrap ErrorBoundary to provide translations
  const WrappedErrorBoundary = ({ children }) => (
    <ErrorBoundary t={t}>
      {children}
    </ErrorBoundary>
  );

  return (
    <WrappedErrorBoundary>
      <GcdsContainer size="xl" mainContainer centered tag="main" className="mb-600" chat-app-wrapper>
        <h1 className='mb-400'>{t('homepage.title')}</h1>
        {serviceStatus && !serviceStatus.isAvailable && (
          <div className="service-status-alert" style={{ 
            backgroundColor: '#F3E9E8', 
            border: '1px solid #BC3331', 
            padding: '1rem', 
            marginBottom: '1rem',
            borderRadius: '4px'
          }}>
            <strong>Service Status: </strong>{serviceStatus.message}
          </div>
        )}
        <h2 className='mt-400 mb-400'>{t('homepage.subtitle')}</h2>
        <GcdsText className='mb-400'>
          {t('homepage.intro.researchOnly')}
        </GcdsText>
        
        <GcdsDetails detailsTitle={t('homepage.about.title')} className='mb-400'>
          <GcdsText>{t('homepage.about.privacyNote')}</GcdsText>
          <GcdsText>{t('homepage.about.aiServices.claude')}</GcdsText>
          <GcdsText>{t('homepage.about.aiServices.chatgpt')}</GcdsText>
          <GcdsText>
            <GcdsLink href="https://github.com/lisafast/react-answers/blob/main/src/services/systemPrompt.js">
              {t('homepage.about.systemPrompt')}
            </GcdsLink>
          </GcdsText>
          <GcdsText>{t('homepage.about.contact')}</GcdsText>
        </GcdsDetails>

        <TempChatAppContainer lang={lang} />
      </GcdsContainer>

      <GcdsContainer size="xl" mainContainer centered tag="below" className="mb-600">
        {/* TODO: make this only show up after an ai response was successfully displayed */}
        <GcdsText>
          <a 
            href="https://cdssnc.qualtrics.com/jfe/form/SV_4N2YTcAHkcBEGfs" 
            className="feedback-survey-link" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            {t('homepage.feedback.surveyLink')}
          </a>
        </GcdsText>

        <GcdsDetails detailsTitle={t('homepage.privacy.title')} className='mb-400'>
          <GcdsText>{t('homepage.privacy.storage')}</GcdsText>
          <GcdsText>{t('homepage.privacy.disclaimer')}</GcdsText>
          <GcdsText>
            {t('homepage.privacy.terms')}{' '}
            <GcdsLink href="https://www.canada.ca/en/transparency/terms.html">
              {t('homepage.privacy.termsLink')}
            </GcdsLink>
          </GcdsText>
          <GcdsLink href="/admin">Ad</GcdsLink>
        </GcdsDetails>
      </GcdsContainer>
    </WrappedErrorBoundary>
  );
};

export default HomePage;