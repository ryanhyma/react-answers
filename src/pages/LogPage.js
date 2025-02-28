import React, { useState, useEffect } from 'react';
import { GcdsContainer, GcdsText, GcdsLink, GcdsInput } from '@cdssnc/gcds-components-react';
import { useTranslations } from '../hooks/useTranslations.js';
import { usePageContext } from '../hooks/usePageParam.js';
import DatabaseLogs from '../components/admin/DatabaseLogs.js';
import { getApiUrl } from '../utils/apiToUrl.js';

const LogPage = () => {
  const { t } = useTranslations();
  const { lang } = usePageContext();
  const [chatId, setChatId] = useState('');
  const [logs, setLogs] = useState([]);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);

  useEffect(() => {
    const storedChatId = localStorage.getItem('chatId');
    if (storedChatId) {
      setChatId(storedChatId);
    }
  }, []);

  const handleChatIdChange = (newChatId) => {
    setChatId(newChatId);
    localStorage.setItem('chatId', newChatId);
  };

  const fetchLogs = () => {
    const idToUse = chatId || localStorage.getItem('chatId');
    if (!idToUse) return;

    fetch(getApiUrl(`db-log?chatId=${idToUse}`))
      .then(response => response.json())
      .then(data => setLogs(data.logs))
      .catch(error => console.error('Error fetching logs:', error));
  };

  const startLogging = (shouldStart) => {
    setIsPolling(shouldStart);
    
    if (!shouldStart && pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
      return;
    }

    // Initial fetch if we're starting polling
    if (shouldStart) {
      fetchLogs();
      // Set up polling
      const interval = setInterval(fetchLogs, 5000);
      setPollingInterval(interval);
    }
  };

  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  return (
    <GcdsContainer size="xl" mainContainer centered tag="main" className="mb-600">
      <h1 className='mb-400'>Logs Dashboard</h1>
      <nav className="mb-400">
        <GcdsText>
          <GcdsLink href={`/${lang}/admin`}>Back to Admin</GcdsLink>
        </GcdsText>
      </nav>

      <section className="mb-600">
        <div className="mb-400">
          <GcdsInput
            type="text"
            label="Enter Chat ID:"
            value={chatId}
            onChange={(e) => handleChatIdChange(e.target.value)}
            required
          />
        </div>
        <DatabaseLogs 
          logs={logs}
          chatId={chatId}
          onStartLogging={startLogging}
          onChatIdChange={handleChatIdChange}
        />
      </section>
    </GcdsContainer>
  );
};

export default LogPage;