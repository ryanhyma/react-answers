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
import '../../styles/App.css';

const MAX_POLLING_DURATION = 24 * 60 * 60 * 1000; // 24 hours (in milliseconds)
const POLLING_INTERVAL = 10 * 60 * 1000; // 10 minutes (in milliseconds)   

const Evaluator = ({ selectedEntries, ...otherProps }) => {
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

    const [selectedLanguage, setSelectedLanguage] = useState('en');
    const [adminCode, setAdminCode] = useState('');
    const correctAdminCode = '2024';

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

            if (problemDetailsIndex === -1) {
                throw new Error('Required column "Problem Details" not found in CSV file. Please ensure you are using a file with that column or downloaded from the Feedback Viewer.');
            }

            const entries = lines.slice(1)
                .map(line => {
                    const values = parseCSVLine(line);
                    const question = values[problemDetailsIndex]?.trim();
                    // Only get URL if the column exists
                    const url = urlIndex !== -1 ? values[urlIndex]?.trim() : '';

                    if (question) {
                        console.log('Processing valid entry:', { question, url });
                    }

                    return {
                        question: question || '',
                        referringUrl: url || ''
                    };
                })
                .filter(entry => entry.question); // Only filter based on question presence

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

    // TODO: Batch Processing Improvements Needed
    // - Add timestamp when creating batches
    // - Create new API endpoint /api/process-pending-batches to handle background processing
    // - Set up cron job using cron-job.org to periodically check batch status
    // - Add database table/schema for tracking batch status
    // - Update UI to show that processing will continue even if user leaves page
    // See conversation: https://github.com/your-repo/issues/XX
    const processBatch = async (entries) => {
        try {
            console.log(`Starting batch processing for ${entries.length} entries...`);
            
            setProcessing(true);
            setBatchStatus('preparing');
            setError(null);
            setProcessedCount(0);
            
            // Load appropriate system prompt based on selected AI
            const systemPrompt = await loadSystemPrompt(selectedLanguage);
            
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
            
            console.log('Sending batch request with:', {
                requestCount: requests.length,
                systemPromptLength: systemPrompt.length,
                aiService: selectedAI
            });

            // Select endpoint based on AI service
            const endpoint = selectedAI === 'claude' ? '/api/claude-batch' : '/api/gpt-batch';
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 55000); // 55 second timeout

            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

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
                if (error.name === 'AbortError') {
                    throw new Error('Request timed out while creating batch. The operation may still be processing.');
                }
                throw error;
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
        console.log(`Starting to process ${results.length} results from batch...`);
        const processingErrors = [];
        
        for (const [index, result] of results.entries()) {
            try {
                console.log(`Processing result ${index + 1}:`, result);
                
                // Handle Anthropic batch format
                if (!result.result?.message?.content) {
                    throw new Error(`No valid response content found in result ${index + 1}`);
                }

                // Get the full response content with all tags intact
                const content = result.result.message.content[0]?.text;
                if (!content) {
                    throw new Error('Missing response text content');
                }

                // Extract citation URL and confidence while preserving the original content
                const citationMatch = content.match(/<citation-url>(.*?)<\/citation-url>/);
                const confidenceMatch = content.match(/<confidence>(.*?)<\/confidence>/);
                
                const citationUrl = citationMatch ? citationMatch[1] : null;
                const confidenceRating = confidenceMatch ? parseFloat(confidenceMatch[1]) : null;

                if (!citationUrl || !confidenceRating) {
                    throw new Error('Missing citation URL or confidence rating');
                }

                // Get the original question from the input
                const originalQuestion = result.input?.messages?.[0]?.content || '';

                const logEntry = {
                    redactedQuestion: originalQuestion,
                    aiResponse: content,  // Keeping full response with all tags
                    aiService: 'claude',
                    referringUrl: citationUrl,
                    citationUrl,
                    confidenceRating
                };

                console.log(`Logging entry ${index + 1}:`, logEntry);
                await LoggingService.logInteraction(logEntry, true);
                setProcessedCount(prev => prev + 1);
                
            } catch (error) {
                const errorDetails = {
                    index,
                    error: error.message,
                    result: JSON.stringify(result)
                };
                console.error('Error processing result:', errorDetails);
                processingErrors.push(errorDetails);
            }
        }
        
        if (processingErrors.length > 0) {
            console.error(`Completed with ${processingErrors.length} errors:`, processingErrors);
            setError(`${processingErrors.length} entries failed to process. Check console for details.`);
        }
        
        console.log('Batch processing complete!');
    }, []);

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

            if (selectedAI === 'claude') {
                // Existing Claude batch handling
                setBatchStatus(data.status);
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
            } else {
                // GPT batch handling
                setBatchStatus(data.status);
                setLastCheckTime(new Date());

                if (data.status === 'completed' && data.output_file_id) {
                    setIsPolling(false);
                    const results = await fetch(`/api/gpt-batch-results?fileId=${data.output_file_id}`);
                    const resultData = await results.json();
                    setBatchResults(resultData);
                    await processResults(resultData);
                    setProcessing(false);
                }
                
                if (data.status === 'failed') {
                    setIsPolling(false);
                    setError('GPT batch processing failed. Please check the error logs.');
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

    // // Add function to fetch GPT batch results HAS TO BE FIXED EVENTUALLY
    // const fetchGPTBatchResults = async (outputFileId) => {
    //     try {
    //         const response = await fetch(`/api/gpt-batch-results?fileId=${outputFileId}`);
    //         if (!response.ok) {
    //             throw new Error('Failed to fetch batch results');
    //         }
    //         return await response.json();
    //     } catch (error) {
    //         console.error('Error fetching GPT batch results:', error);
    //         throw error;
    //     }
    // };

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
                        <GcdsText className="error-text">{error}</GcdsText>
                        <button 
                            onClick={handleReconnect}
                            className="secondary-button force-style-button"
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
                                    Checking status every 10 minutes... 
                                    Large batches may take up to 24 hours to complete. Leave this page open for now. 
                                </GcdsText>
                                <GcdsText>
                                    Last checked: {lastCheckTime ? formatTimestamp(lastCheckTime) : 'Not yet checked'}
                                </GcdsText>
                                <button 
                                    onClick={handleCancel}
                                    className="secondary-button force-style-button"
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

    // Add a loading indicator component
    const LoadingIndicator = ({ status, processedCount, total }) => {
        return (
            <div className="flex flex-col items-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <div className="text-sm text-gray-600">
                    {status === 'preparing' && 'Creating batch...'}
                    {status === 'in_progress' && `Processing ${processedCount} of ${total} entries...`}
                    {status === 'validating' && 'Validating results...'}
                </div>
            </div>
        );
    };

    // Add language toggle handler
    const handleLanguageToggle = (e) => {
        setSelectedLanguage(e.target.value);
    };

    const handleAdminCodeChange = (e) => {
        setAdminCode(e.target.value);
    };

    return (
        <GcdsContainer className="mb-600">
            <div className="steps-container">
                <div className="step">
                    <GcdsHeading tag="h3">Step 1: Select Settings</GcdsHeading>
                    <GcdsText>Select the AI service, language, and your CSV file. Use one you've downloaded and cleaned from the Feedback viewer, or any CSV file with a column labelled 'Problem Details' with the questions and an optional URL column with a referring URL. Admin code is required to enable file upload (temporary fix for testing).</GcdsText>

                    <form onSubmit={handleUpload} className="mt-400">
                        <div className="admin-code-input mrgn-bttm-20">
                            <label htmlFor="adminCode mrgn-bttm-10 display-block">
                                Enter Admin Code to enable file upload:
                            </label>
                            <input
                                type="text"
                                id="adminCode"
                                value={adminCode}
                                onChange={handleAdminCodeChange}
                                className="mrgn-bttm-10"
                            />
                        </div>

                        <div className="ai-toggle">
                            <fieldset className="ai-toggle_fieldset">
                                <div className="ai-toggle_container">
                                    <legend className="ai-toggle_legend">AI Service:</legend>
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
                                            className="ai-toggle__radio-input"
                                        />
                                        <label htmlFor="chatgpt">OpenAI ChatGPT 4</label>
                                    </div>
                                </div>
                            </fieldset>
                        </div>

                        <div className="language-toggle mrgn-bttm-20">
                            <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <legend style={{ marginRight: '10px' }}>Evaluation Language:</legend>
                                    <div style={{ display: 'flex', alignItems: 'center', marginRight: '15px' }}>
                                        <input
                                            type="radio"
                                            id="english"
                                            name="language-selection"
                                            value="en"
                                            checked={selectedLanguage === 'en'}
                                            onChange={handleLanguageToggle}
                                            className="ai-toggle__radio-input"
                                        />
                                        <label htmlFor="english" style={{ marginRight: '15px' }}>English</label>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <input
                                            type="radio"
                                            id="french"
                                            name="language-selection"
                                            value="fr"
                                            checked={selectedLanguage === 'fr'}
                                            onChange={handleLanguageToggle}
                                            className="ai-toggle__radio-input"
                                        />
                                        <label htmlFor="french">French</label>
                                    </div>
                                </div>
                            </fieldset>
                        </div>

                        <div className="batch-toggle mrgn-bttm-20">
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

                        <div className="file-input-container mrgn-bttm-20">
                            <label htmlFor="csvFile mrgn-bttm-10 display-block">
                                Select feedback CSV file:
                            </label>
                            <input
                                type="file"
                                id="csvFile"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="mrgn-bttm-10"
                            />
                            {file && (
                                <div>Selected file: {file.name}</div>
                            )}
                        </div>

                        {error && (
                            <div className="error-message mrgn-bttm-10" style={{ color: 'red' }}>
                                {error}
                            </div>
                        )}

                        {file && !fileUploaded && (
                            <button 
                                type="submit"
                                className="primary-button force-style-button"
                                disabled={adminCode !== correctAdminCode}
                            >
                                Upload File
                            </button>
                        )}

                        {processing && (
                            <div className="mt-4">
                                <LoadingIndicator 
                                    status={batchStatus} 
                                    processedCount={processedCount}
                                    total={selectedEntries?.length || 0}
                                />
                                {batchStatus === 'preparing' && selectedAI === 'chatgpt' && (
                                    <div className="text-sm text-gray-500 mt-2">
                                        This may take up to a minute to start...
                                    </div>
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
                                    <button 
                                        onClick={handleProcessFile}
                                        className="secondary-button force-style-button"
                                    >
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