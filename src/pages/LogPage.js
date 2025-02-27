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

  // Get chatId from localStorage on component mount
  useEffect(() => {
    const storedChatId = localStorage.getItem('chatId');
    if (storedChatId) {
      setChatId(storedChatId);
    }
  }, []);

  const handleChatIdChange = (e) => {
    const newChatId = e.target.value;
    setChatId(newChatId);
    if (newChatId) {
      localStorage.setItem('chatId', newChatId);
    }
  };

  const startLogging = () => {
    // Use stored chatId if current is empty
    const idToUse = chatId || localStorage.getItem('chatId');
    if (!idToUse) return;

    // Clear any existing polling
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    // Initial fetch
    fetch(getApiUrl(`db-log?chatId=${idToUse}`))
      .then(response => response.json())
      .then(data => setLogs(data.logs))
      .catch(error => console.error('Error fetching logs:', error));

    // Set up new polling interval
    const interval = setInterval(() => {
      fetch(getApiUrl(`db-log?chatId=${idToUse}`))
        .then(response => response.json())
        .then(data => setLogs(data.logs))
        .catch(error => console.error('Error fetching logs:', error));
    }, 5000);

    setPollingInterval(interval);
    setIsPolling(true);
  };

  // Cleanup on unmount
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
        <h2 className='mt-400 mb-400'>Chat Logs</h2>
        <div className="mb-400">
          <GcdsInput
            type="text"
            label="Enter Chat ID:"
            value={chatId}
            onChange={handleChatIdChange}
            required
          />
        </div>
        <DatabaseLogs 
          logs={isPolling ? logs : null}
          chatId={chatId}
          onStartLogging={startLogging}
        />
      </section>
    </GcdsContainer>
  );
};

export default LogPage;