import React, { useState, useEffect, useRef } from 'react';
import { GcdsContainer, GcdsText, GcdsLink, GcdsButton } from '@cdssnc/gcds-components-react';
import { useTranslations } from '../hooks/useTranslations.js';
import { usePageContext } from '../hooks/usePageParam.js';
import AdminCodeInput from '../components/admin/AdminCodeInput.js';
import { getApiUrl } from '../utils/apiToUrl.js';
import $ from 'jquery';

const LogPage = () => {
  const { t } = useTranslations();
  const { lang } = usePageContext();
  const [chatId, setChatId] = useState('');
  const [logs, setLogs] = useState([]);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [adminCode, setAdminCode] = useState('');
  const correctAdminCode = '2024';
  const tableRef = useRef(null);
  const dataTableRef = useRef(null);
  
  // Auto-refresh once on initial mount
  useEffect(() => {
    const storedChatId = localStorage.getItem('chatId');
    if (storedChatId) {
      setChatId(storedChatId);
    }
  }, []);

  // DataTable initialization and update
  useEffect(() => {
    if (logs?.length > 0 && tableRef.current) {
      // Ensure we clean up any existing DataTable before creating a new one
      if (dataTableRef.current) {
        dataTableRef.current.destroy();
        dataTableRef.current = null;
      }
      
      // Initialize DataTable
      dataTableRef.current = $(tableRef.current).DataTable({
        data: logs, // Directly provide data during initialization
        columns: [
          { 
            title: 'Created At', 
            data: 'createdAt',
            render: data => {
              const date = new Date(data);
              return date.toLocaleString();
            }
          },
          { 
            title: 'Level', 
            data: 'logLevel',
            render: data => data ?? ''
          },
          { 
            title: 'Message', 
            data: 'message',
            render: data => data ?? ''
          },
          { 
            title: 'Metadata', 
            data: 'metadata', 
            render: data => {
              if (!data) return '';
              
              // Handle the metadata more carefully to prevent escaping issues
              try {
                // If data is already a string, don't stringify it again
                const metadataStr = typeof data === 'string' ? data : JSON.stringify(data);
                // Replace newlines with <br/> for display
                return metadataStr.replace(/\\n/g, "<br/>");
              } catch (e) {
                console.error("Error formatting metadata:", e);
                return String(data);
              }
            }
          }
        ],
        order: [[0, 'desc']]
      });
      
      // No need to add rows here as we're providing the data during initialization
    }

    return () => {
      if (dataTableRef.current) {
        dataTableRef.current.destroy();
        dataTableRef.current = null;
      }
    };
  }, [logs]);

  const handleChatIdChange = (e) => {
    const newValue = e.target ? e.target.value : e;
    
    // If chat ID changes, stop polling and clear the data table
    if (newValue !== chatId) {
      if (isPolling && pollingInterval) {
        console.log("Stopping polling due to chat ID change");
        clearInterval(pollingInterval);
        setIsPolling(false);
        setPollingInterval(null);
      }
      
      // Properly cleanup DataTable before clearing logs
      if (dataTableRef.current) {
        console.log("Destroying DataTable instance before changing chat ID");
        dataTableRef.current.destroy();
        dataTableRef.current = null;
      }
      
      // Clear logs when chat ID changes
      setLogs([]);
    }
    
    setChatId(newValue);
  };

  // Explicitly refresh the chat ID from localStorage when button is clicked
  const handleRefreshChatId = () => {
    console.log("Refreshing chat ID from localStorage");
    const storedChatId = localStorage.getItem('chatId');
    if (storedChatId) {
      console.log("Found chat ID in localStorage:", storedChatId);
      setChatId(storedChatId);
    } else {
      console.log("No chat ID found in localStorage");
    }
  };

  const handleAdminCodeChange = (e) => {
    setAdminCode(e.target.value);
  };

  const fetchLogs = () => {
    // Always use the current state value - never auto-refresh from localStorage
    if (!chatId) {
      console.log("No chat ID available, cannot fetch logs");
      return;
    }
    
    console.log("Fetching logs for chat ID:", chatId);
    fetch(getApiUrl(`db-log?chatId=${chatId}`))
      .then(response => response.json())
      .then(data => {
        console.log("Logs fetched successfully:", data.logs?.length || 0, "entries");
        
        // Simply update the logs state - the useEffect will handle recreating the table
        setLogs(data.logs || []);
      })
      .catch(error => console.error('Error fetching logs:', error));
  };

  const handleStartStopLogging = () => {
    const newIsPolling = !isPolling;
    console.log(newIsPolling ? "Starting" : "Stopping", "logging with chat ID:", chatId);
    setIsPolling(newIsPolling);
    
    if (!newIsPolling && pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
      return;
    }

    // Initial fetch if we're starting polling - uses whatever ID is currently in the input
    if (newIsPolling) {
      fetchLogs(); // Uses current chatId state value
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

  const canStartLogging = adminCode === correctAdminCode && chatId;

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
          <div className="">
            <label htmlFor="chatIdInput" className="block mb-2">Enter Chat ID:</label>
            <input
              id="chatIdInput"
              name="chatId"
              type="text"
              value={chatId}
              onChange={handleChatIdChange}
              required
              className="form-control p-2 border rounded w-full"
            />
          </div>
          <GcdsButton
            type="button"
            onClick={handleRefreshChatId}
            className="mt-4"
          >
            Refresh Chat ID from localStorage
          </GcdsButton>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <AdminCodeInput
              code={adminCode}
              onChange={handleAdminCodeChange}
              correctCode={correctAdminCode}
              label="Enter Admin Code to view database logs:"
            />
          </div>

          {adminCode === correctAdminCode && (
            <div className="flex gap-4 items-center">
              <GcdsButton
                type="button"
                disabled={!canStartLogging}
                onClick={handleStartStopLogging}
              >
                {isPolling ? t('logging.pause') : t('logging.start')}
              </GcdsButton>
              {isPolling && (
                <div className="text-green-600 font-medium">Polling active for chat ID: {chatId}</div>
              )}
            </div>
          )}

          {canStartLogging && logs && (
            <div className="bg-white shadow rounded-lg">
              {logs?.length > 0 ? (
                <div className="p-4">
                  <table ref={tableRef} className="display">
                    <thead>
                      <tr>
                        <th>Created At</th>
                        <th>Level</th>
                        <th>Message</th>
                        <th>Metadata</th>
                      </tr>
                    </thead>
                  </table>
                </div>
              ) : (
                <div className="p-4">
                  <p className="text-gray-500">No logs available</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </GcdsContainer>
  );
};

export default LogPage;