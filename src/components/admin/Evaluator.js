// src/components/admin/Evaluator.js
import React, { useState, useCallback, useEffect } from 'react';
import {
    GcdsContainer,
    GcdsHeading,
    GcdsText
} from '@cdssnc/gcds-components-react';
import LoggingService from '../../services/LoggingService';
import ClaudeService from '../../services/ClaudeService';
import ChatGPTService from '../../services/ChatGPTService';
import RedactionService from '../../services/RedactionService';
import { parseEvaluationResponse } from '../../utils/evaluationParser';
import loadSystemPrompt from '../../services/systemPrompt.js';

const MAX_POLLING_DURATION = 12 * 60 * 60 * 1000; // 12 hours (in milliseconds)
const POLLING_INTERVAL = 5 * 60 * 1000; // 5 minutes (in milliseconds)   

const Evaluator = () => {
    const [file, setFile] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [processedCount, setProcessedCount] = useState(0);
    const [totalEntries, setTotalEntries] = useState(0);
    const [selectedAI, setSelectedAI] = useState('claude');
    const [fileUploaded, setFileUploaded] = useState(false);

    const [useBatchProcessing, setUseBatchProcessing] = useState(true);
    const [batchId, setBatchId] = useState(null);
    const [batchStatus, setBatchStatus] = useState(null);
    const [batchResults, setBatchResults] = useState(null);
    const [isPolling, setIsPolling] = useState(false);
    const [pollStartTime, setPollStartTime] = useState(null);
    const [lastCheckTime, setLastCheckTime] = useState(null);

    const [pollingErrors, setPollingErrors] = useState(0);

    const handleFileChange = (event) => {
        setError(null);
        const uploadedFile = event.target.files[0];
        
        if (!uploadedFile) {
            setFile(null);
            return;
        }
    
        if (!uploadedFile.name.endsWith('.csv')) {
            setError('Please upload a CSV file that you downloaded from the Feedback Viewer');
            setFile(null);
            return;
        }
    
        setFile(uploadedFile);
        setResults(null);
        setProcessedCount(0);
        setFileUploaded(false);
    };

    const handleAIToggle = (e) => {
        setSelectedAI(e.target.value);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        
        if (!file) {
            setError('Please select a file first');
            return;
        }

        try {
            await file.text();
            setFileUploaded(true);
            setError(null);
        } catch (err) {
            setError('Failed to read the file. Please try uploading again.');
            console.error('Error reading file:', err);
        }
    };

    const isValidLine = (line) => {
        // Remove all commas and whitespace
        const cleanLine = line.replace(/,/g, '').trim();
        return cleanLine.length > 0;
    };

    const parseCSVLine = (line) => {
        const values = [];
        let currentValue = '';
        let withinQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                withinQuotes = !withinQuotes;
                continue;
            }
            
            if (char === ',' && !withinQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
                continue;
            }
            
            currentValue += char;
        }
        
        values.push(currentValue.trim());
        return values;
    };

    const processCSV = (csvText) => {
        try {
            const lines = csvText
                .split(/\r?\n/)
                .filter(line => isValidLine(line));
            
            const headers = parseCSVLine(lines[0]);
            const problemDetailsIndex = headers.findIndex(h => h.trim() === 'Problem Details');
            const urlIndex = headers.findIndex(h => h.trim() === 'URL');

            if (problemDetailsIndex === -1 || urlIndex === -1) {
                throw new Error('Required columns "Problem Details" and "URL" not found in CSV file. Please ensure you are using a file with those columns ordownloaded from the Feedback Viewer.');
            }

            const entries = lines.slice(1)
                .map(line => {
                    const values = parseCSVLine(line);
                    const question = values[problemDetailsIndex]?.trim();
                    const url = values[urlIndex]?.trim();

                    if (question && url) {
                        console.log('Processing valid entry:', { question, url });
                    }

                    return {
                        question: question || '',
                        referringUrl: url || ''
                    };
                })
                .filter(entry => entry.question && entry.referringUrl);

            console.log(`Found ${entries.length} valid entries to process`);
            return entries;
        } catch (error) {
            console.error('Error processing CSV:', error);
            throw new Error(`Failed to process CSV file: ${error.message}`);
        }
    };

    const processEntry = async (entry) => {
        try {
            const { redactedText } = RedactionService.redactText(entry.question);
            const messageWithUrl = `<evaluation>${redactedText}\n<referring-url>${entry.referringUrl}</referring-url></evaluation>`;

            const aiResponse = selectedAI === 'claude' 
                ? await ClaudeService.sendMessage(messageWithUrl)
                : await ChatGPTService.sendMessage(messageWithUrl);

            const { citationUrl, confidenceRating } = parseEvaluationResponse(aiResponse, selectedAI);

            const logEntry = {
                redactedQuestion: redactedText,
                aiResponse,
                aiService: selectedAI,
                referringUrl: entry.referringUrl,
                citationUrl,
                confidenceRating
            };

            await LoggingService.logInteraction(logEntry, true);
            setProcessedCount(prev => prev + 1);
        } catch (error) {
            console.error('Error processing entry:', error);
            throw error;
        }
    };

    const handleBatchToggle = (e) => {
        setUseBatchProcessing(e.target.checked);
    };

    const processBatch = async (entries) => {
        try {
            console.log(`Starting batch processing for ${entries.length} entries...`);
            
            // Set all relevant states at the start
            setProcessing(true);
            setBatchStatus('preparing');
            setError(null);
            
            const systemPrompt = await loadSystemPrompt();
            
            // Format entries for batch processing
            const requests = entries.map((entry, index) => {
                const { redactedText } = RedactionService.redactText(entry.question);
                const messageWithUrl = `<evaluation>${redactedText}\n<referring-url>${entry.referringUrl}</referring-url></evaluation>`;
                console.log(`Entry ${index + 1} formatted:`, messageWithUrl);
                return messageWithUrl;
            });

            const payload = {
                requests,
                systemPrompt
            };
            
            console.log('Payload being sent to API:', {
                requestCount: requests.length,
                systemPromptLength: systemPrompt.length
            });

            // Select the appropriate endpoint based on the AI service
            const endpoint = selectedAI === 'claude' ? '/api/claude-batch' : '/api/gpt-batch';
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                timeout: 60000 // 60 seconds
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch (e) {
                    errorData = { error: errorText };
                }
                throw new Error(`API error: ${errorData.details || errorData.error || response.statusText}`);
            }

            const data = await response.json();
            console.log(`${selectedAI} batch response:`, data);
            
            if (data.batchId) {
                console.log(`Batch created successfully. Batch ID: ${data.batchId}`);
                setBatchId(data.batchId);
                setBatchStatus('in_progress');
                setIsPolling(true);
                setPollStartTime(Date.now());
            } else {
                throw new Error('No batch ID received from API');
            }
        } catch (error) {
            console.error('Error processing batch:', error);
            setError(`Failed to start batch processing: ${error.message}`);
            setProcessing(false);
            setBatchStatus(null);
            setIsPolling(false);
        }
    };

    const processResults = useCallback(async (results) => {
        console.log(`Processing ${results.length} results from batch...`);
        for (const [index, result] of results.entries()) {
            try {
                const response = selectedAI === 'claude' 
                    ? result.message.content
                    : result.choices[0].message.content;

                const { citationUrl, confidenceRating } = parseEvaluationResponse(
                    response,
                    selectedAI
                );

                const logEntry = {
                    redactedQuestion: selectedAI === 'claude'
                        ? result.original_request.params.messages[0].content
                        : result.request.messages[1].content,
                    aiResponse: response,
                    aiService: selectedAI,
                    referringUrl: selectedAI === 'claude'
                        ? result.original_request.params.messages[0].content.match(/<referring-url>(.*?)<\/referring-url>/)[1]
                        : result.request.messages[1].content.match(/<referring-url>(.*?)<\/referring-url>/)[1],
                    citationUrl,
                    confidenceRating
                };

                await LoggingService.logInteraction(logEntry, true);
                setProcessedCount(prev => prev + 1);
            } catch (error) {
                console.error(`Error processing result ${index + 1}:`, error);
            }
        }
        console.log('Batch processing complete!');
    }, [selectedAI]);

    const handleProcessFile = async () => {
        if (!file) return;

        console.log('Starting process, current states:', {
            processing,
            batchStatus,
            useBatchProcessing
        });

        setProcessing(true);  // This should hide the Start Processing button
        setError(null);
        setProcessedCount(0);

        try {
            const text = await file.text();
            const entries = processCSV(text);
            setTotalEntries(entries.length);

            console.log('After setting initial states:', {
                processing: true,
                entriesLength: entries.length
            });

            if (useBatchProcessing) {
                await processBatch(entries);
            } else {
                const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
                for (const entry of entries) {
                    await processEntry(entry);
                    if (selectedAI === 'chatgpt') {
                        await delay(2000);
                    }
                }
            }

            setResults({
                fileName: file.name,
                size: file.size,
                entriesProcessed: entries.length
            });

        } catch (error) {
            console.error('Process file error:', error);
            setError(error.message);
            setProcessing(false);
        }
    };

    const checkBatchStatus = useCallback(async () => {
        if (!batchId) return;
        
        try {
            console.log(`Checking status for batch ${batchId}...`);
            const endpoint = selectedAI === 'claude' 
                ? '/api/claude-batch-status' 
                : '/api/gpt-batch-status';
            
            const response = await fetch(`${endpoint}?batchId=${batchId}`);
            
            if (!response.ok) {
                throw new Error(`Status check failed: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Status response:', data);

            // Map GPT status to match our UI expectations
            let displayStatus = data.status;
            if (selectedAI === 'chatgpt') {
                switch(data.status) {
                    case 'completed':
                        displayStatus = 'ended';
                        break;
                    case 'in_progress':
                        displayStatus = 'processing';
                        break;
                    case 'validating':
                        displayStatus = 'preparing';
                        break;
                    case 'cancelling':
                        displayStatus = 'cancelling';
                        break;
                    case 'cancelled':
                        displayStatus = 'cancelled';
                        break;
                    case 'failed':
                        displayStatus = 'error';
                        break;
                    default:
                        displayStatus = data.status;
                        break;
                }
            }
            
            setBatchStatus(displayStatus);
            setLastCheckTime(new Date());

            if (selectedAI === 'chatgpt') {
                setProcessedCount(data.request_counts?.completed || 0);
                
                // Handle completion
                if (data.status === 'completed' && data.output_file_id) {
                    setIsPolling(false);
                    // You'll need to implement a way to fetch results from the output file
                    const results = await fetchGPTBatchResults(data.output_file_id);
                    setBatchResults(results);
                    await processResults(results);
                    setProcessing(false);
                }
            } else {
                // Existing Claude batch handling
                if (data.processedCount) {
                    setProcessedCount(data.processedCount);
                }
                
                if (data.status === 'ended' && data.results) {
                    setIsPolling(false);
                    const results = data.results.split('\n')
                        .filter(line => line.trim())
                        .map(line => JSON.parse(line));
                    setBatchResults(results);
                    
                    const unprocessedResults = results.slice(processedCount);
                    if (unprocessedResults.length > 0) {
                        await processResults(unprocessedResults);
                    }
                    setProcessing(false);
                }
            }
        } catch (error) {
            console.error('Error checking batch status:', error);
            setPollingErrors(prev => prev + 1);
            if (pollingErrors > 5) {
                setIsPolling(false);
                setError('Lost connection to server. The batch is still processing - please refresh the page to reconnect.');
            }
        }
    }, [batchId, processResults, processedCount, pollingErrors, selectedAI]);

    // Add function to fetch GPT batch results
    const fetchGPTBatchResults = async (outputFileId) => {
        try {
            const response = await fetch(`/api/gpt-batch-results?fileId=${outputFileId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch batch results');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching GPT batch results:', error);
            throw error;
        }
    };

    const handleCancel = async () => {
        if (!batchId) return;
        
        try {
            const response = await fetch('/api/claude-batch-cancel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ batchId })
            });
            
            if (!response.ok) {
                throw new Error('Failed to cancel batch');
            }
            
            setIsPolling(false);
            setBatchStatus('canceling');
        } catch (error) {
            console.error('Error canceling batch:', error);
            setError('Failed to cancel batch: ' + error.message);
        }
    };

    useEffect(() => {
        let pollInterval;
        let isActive = true;
        
        if (isPolling && batchId) {
            setPollStartTime(prev => prev || Date.now());
            
            const doPoll = async () => {
                if (!isActive) return;

                const elapsedTime = Date.now() - pollStartTime;
                
                if (elapsedTime > MAX_POLLING_DURATION) {
                    console.log('Maximum polling duration reached');
                    setIsPolling(false);
                    setError('Polling timeout reached. Please check batch status manually.');
                    return;
                }
                
                try {
                    await checkBatchStatus();
                } catch (error) {
                    console.error('Polling error:', error);
                    // Don't stop polling on error, will retry on next interval
                }
            };

            doPoll();
            
            pollInterval = setInterval(doPoll, POLLING_INTERVAL);
        }
        
        return () => {
            isActive = false;
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [isPolling, batchId, pollStartTime, checkBatchStatus]);

    const formatTimestamp = (date) => {
        if (!date) return '';
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: true 
        });
    };

    const handleReconnect = () => {
        setPollingErrors(0);
        setError(null);
        setIsPolling(true);
    };

    const renderBatchStatus = () => {
        if (!processing || !batchId) return null;
        
        return (
            <div className="processing-status mt-400">
                <GcdsText>File: {file.name}</GcdsText>
                <GcdsText>Total entries to process: {totalEntries}</GcdsText>
                
                {error ? (
                    <>
                        <GcdsText style={{ color: 'red' }}>{error}</GcdsText>
                        <button 
                            onClick={handleReconnect}
                            className="secondary-button"
                            style={{
                                marginTop: '10px',
                                padding: '8px 16px',
                                backgroundColor: '#26374a',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Reconnect
                        </button>
                    </>
                ) : (
                    <>
                        <GcdsText>Batch Status: {batchStatus || 'preparing'}</GcdsText>
                        <GcdsText>Processed: {processedCount} of {totalEntries}</GcdsText>
                        
                        {batchStatus === 'in_progress' && (
                            <>
                                <GcdsText>
                                    Checking status every 5 minutes... 
                                    Large batches may take several hours to complete.
                                </GcdsText>
                                <GcdsText>
                                    Last checked: {lastCheckTime ? formatTimestamp(lastCheckTime) : 'Not yet checked'}
                                </GcdsText>
                                <button 
                                    onClick={handleCancel}
                                    className="secondary-button"
                                    style={{
                                        marginTop: '10px',
                                        padding: '8px 16px',
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel Batch
                                </button>
                            </>
                        )}
                    </>
                )}
            </div>
        );
    };

    useEffect(() => {
        console.log('State changed:', {
            processing,
            batchStatus,
            batchId,
            isPolling
        });
    }, [processing, batchStatus, batchId, isPolling]);

    return (
        <GcdsContainer className="mb-600">
            <div className="steps-container">
                <div className="step">
                    <GcdsHeading tag="h3">Step 1: Select Settings</GcdsHeading>
                    <GcdsText>Select the AI service and CSV file that you've downloaded and cleaned from the Feedback viewer. You can use any CSV file as long as there are columns labelled 'Problem Details' and 'URL' with the question and referral URL.</GcdsText>

                    <form onSubmit={handleUpload} className="mt-400">
                        <div className="ai-toggle" style={{ marginBottom: '20px' }}>
                            <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <legend style={{ marginRight: '10px' }}>AI Service:</legend>
                                    <div style={{ display: 'flex', alignItems: 'center', marginRight: '15px' }}>
                                        <input
                                            type="radio"
                                            id="claude"
                                            name="ai-selection"
                                            value="claude"
                                            checked={selectedAI === 'claude'}
                                            onChange={handleAIToggle}
                                            style={{ marginRight: '5px' }}
                                        />
                                        <label htmlFor="claude" style={{ marginRight: '15px' }}>Anthropic Claude 3.5 Sonnet</label>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <input
                                            type="radio"
                                            id="chatgpt"
                                            name="ai-selection"
                                            value="chatgpt"
                                            checked={selectedAI === 'chatgpt'}
                                            onChange={handleAIToggle}
                                            style={{ marginRight: '5px' }}
                                        />
                                        <label htmlFor="chatgpt">OpenAI ChatGPT 4</label>
                                    </div>
                                </div>
                            </fieldset>
                        </div>

                        <div className="batch-toggle" style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="checkbox"
                                    id="batchProcessing"
                                    checked={useBatchProcessing}
                                    onChange={handleBatchToggle}
                                    style={{ marginRight: '5px' }}
                                />
                                <label htmlFor="batchProcessing">
                                    Use batch processing (recommended for large files)
                                </label>
                            </div>
                        </div>

                        <div className="file-input-container" style={{ marginBottom: '20px' }}>
                            <label htmlFor="csvFile" style={{ display: 'block', marginBottom: '10px' }}>
                                Select feedback CSV file:
                            </label>
                            <input
                                type="file"
                                id="csvFile"
                                accept=".csv"
                                onChange={handleFileChange}
                                style={{ marginBottom: '10px' }}
                            />
                            {file && (
                                <div>Selected file: {file.name}</div>
                            )}
                        </div>

                        {error && (
                            <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>
                                {error}
                            </div>
                        )}

                        {file && !fileUploaded && (
                            <button 
                                type="submit"
                                className="primary-button"
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#26374a',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Upload File
                            </button>
                        )}

                        {processing && (
                            <div className="processing-status mt-400">
                                {useBatchProcessing ? (
                                    <>
                                        <GcdsText>Batch Status: {batchStatus || 'Preparing'}</GcdsText>
                                        <GcdsText>Processed: {processedCount} of {totalEntries}</GcdsText>
                                        {batchStatus === 'processing' && (
                                            <>
                                                <GcdsText>
                                                    Checking status every 5 minutes... 
                                                    Large batches may take several hours to complete.
                                                </GcdsText>
                                                <button 
                                                    onClick={handleCancel}
                                                    className="secondary-button"
                                                    style={{
                                                        marginTop: '10px',
                                                        padding: '8px 16px',
                                                        backgroundColor: '#dc3545',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Cancel Batch
                                                </button>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <GcdsText>Processing entries: {processedCount} of {totalEntries}</GcdsText>
                                )}
                            </div>
                        )}

                        {results && (
                            <div className="results-section mt-400">
                                <GcdsHeading tag="h3">Processing Complete</GcdsHeading>
                                <GcdsText>File: {results.fileName}</GcdsText>
                                <GcdsText>Entries processed: {results.entriesProcessed}</GcdsText>
                            </div>
                        )}

                        {fileUploaded && (
                            <div className="processing-controls">
                                {!processing ? (
                                    <button onClick={handleProcessFile}>
                                        Start Processing
                                    </button>
                                ) : (
                                    renderBatchStatus()
                                )}
                            </div>
                        )}

                        {batchResults && (
                            <div className="results-section mt-400">
                                <GcdsHeading tag="h3">Processing Complete</GcdsHeading>
                                <GcdsText>Total entries processed: {processedCount}</GcdsText>
                                <GcdsText>Successfully logged to database</GcdsText>
                                <details>
                                    <summary>View Processing Details</summary>
                                    <pre style={{ whiteSpace: 'pre-wrap' }}>
                                        {JSON.stringify(batchResults.slice(0, 3), null, 2)}... 
                                        {batchResults.length > 3 && `\n(${batchResults.length - 3} more results)`}
                                    </pre>
                                </details>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </GcdsContainer>
    );
};

export default Evaluator;