// src/components/admin/Evaluator.js
import React, { useState, useCallback, useEffect } from 'react';
import {
    GcdsContainer,
    GcdsHeading,
    GcdsText,
} from '@cdssnc/gcds-components-react';
import LoggingService from '../../services/LoggingService.js';
import MessageService from '../../services/MessageService.js';
import RedactionService from '../../services/RedactionService.js';
import ContextService from '../../services/ContextService.js';
import { parseEvaluationResponse } from '../../utils/evaluationParser.js';
import '../../styles/App.css';
import AdminCodeInput from '../admin/AdminCodeInput.js';


const MAX_POLLING_DURATION = 24 * 60 * 60 * 1000; // 24 hours (in milliseconds)
const POLLING_INTERVAL = 10 * 1000;//10 * 60 * 1000; // 10 minutes (in milliseconds)   

const Evaluator = ({ selectedEntries, ...otherProps }) => {
    const [file, setFile] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [processedCount, setProcessedCount] = useState(0);
    const [totalEntries, setTotalEntries] = useState(0);
    const [selectedAI, setSelectedAI] = useState('anthropic');
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
            const problemDetailsIndex = headers.findIndex(h => h.trim().toLowerCase() === 'problem details' || h.trim().toLowerCase() === 'question');
            

            if (problemDetailsIndex === -1) {
                throw new Error('Required column "Problem Details" not found in CSV file. Please ensure you are using a file with that column or downloaded from the Feedback Viewer.');
            }

            const entries = lines.slice(1)
                .map(line => {
                    const values = parseCSVLine(line);
                    const entry = {};

                    headers.forEach((header, index) => {
                        const key = header.trim().toLowerCase() === 'problem details' ? 'question' : header.trim();
                        entry[key] = values[index]?.trim() || '';
                    });

                    console.log('Processing entry:', entry);
                    return entry;
                })
                .filter(entry => entry['question']); // Only filter based on 'question' presence

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
            let messageWithUrl = `<evaluation>${redactedText}\n<referring-url>${entry.referringUrl}</referring-url></evaluation>`;
            const derivedContext = await ContextService.deriveContext(messageWithUrl, selectedLanguage, '');

            console.log('Derived context:', derivedContext);

            messageWithUrl = `<evaluation>${redactedText}${entry.referringUrl ? `\n<referring-url>${entry.referringUrl}</referring-url><evaluation>` : ''
                }${derivedContext.department ? `\n<department>${derivedContext.department}</department>` : ''
                }${derivedContext.topic ? `\n<topic>${derivedContext.topic}</topic>` : ''
                }${derivedContext.topicUrl ? `\n<topicUrl>${derivedContext.topicUrl}</topicUrl>` : ''
                }${derivedContext.departmentUrl ? `\n<departmentUrl>${derivedContext.departmentUrl}</departmentUrl>` : ''
                }${derivedContext.searchResults ? `\n<searchResults>${derivedContext.searchResults}</searchResults>` : ''
                }`;

            const aiResponse = await MessageService.sendMessage(selectedAI,messageWithUrl);
                

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

    const needsContext = (entries) => {
        return entries.some(entry => !entry.context_output_tokens);
    };


    const processBatch = async (entries) => {
        try {
            console.log(`Starting batch processing for ${entries.length} entries...`);

            setProcessing(true);
            setBatchStatus('preparing');
            setError(null);
            setProcessedCount(0);

            if (needsContext(entries)) {
                console.log('Some entries need context. Deriving context batch processing...');
                const result = await ContextService.deriveContextBatch(entries, selectedLanguage, selectedAI);
                console.log('Context batch started: ' + result.batchId);
                return result;
            } else {
                try {
                    const data = await MessageService.sendBatchMessages(selectedAI,entries, selectedLanguage);

                    console.log(`${selectedAI} batch response:`, data);

                    if (data.batchId) {
                        console.log(`Batch created successfully. Batch ID: ${data.batchId}`);
                    } else {
                        throw new Error('No batch ID received from API');
                    }
                    return data;
                } catch (error) {
                    if (error.name === 'AbortError') {
                        throw new Error('Request timed out while creating batch. The operation may still be processing.');
                    }
                    throw error;
                }
            }
        } catch (error) {
            console.error('Error processing batch:', error);
            setError(`Failed to start batch processing: ${error.message}`);
            setProcessing(false);
            setBatchStatus(null);
            setIsPolling(false);
        }
    };



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

            setBatchStatus('started');
            resetForm();

        } catch (error) {
            console.error('Process file error:', error);
            setError(error.message);
            setProcessing(false);
        }
    };

    const resetForm = () => {
        setFile(null);
        setProcessing(false);
        setResults(null);
        setError(null);
        setProcessedCount(0);
        setTotalEntries(0);
        setSelectedAI('anthropic');
        setFileUploaded(false);
        setUseBatchProcessing(true);
        setBatchId(null);
        setBatchStatus(null);
        setBatchResults(null);
        setIsPolling(false);
        setPollStartTime(null);
        setLastCheckTime(null);
        setPollingErrors(0);
        setSelectedLanguage('en');
        setAdminCode('');
        document.getElementById('csvFile').value = ''; // Reset file input
    };

    



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
                    {status === 'started' && 'Batch started...'}

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
                    <GcdsText>Select the AI service, language, and your CSV file. Use one you've downloaded and cleaned from the Feedback viewer.</GcdsText>
                    <GcdsText>CSV must contain:</GcdsText>
                    <ol><li>Problem Details - required</li>
                        <li>URL - optional </li>
                        <li>Context - optional - If left blank, the batch will first derive context, if provided it will use the provided context to retrieve answers</li>
                    </ol>

                    <form onSubmit={handleUpload} className="mt-400">
                        <AdminCodeInput
                            code={adminCode}
                            onChange={handleAdminCodeChange}
                            correctCode={correctAdminCode}
                            label="Enter Admin Code to enable file upload:"
                        />

                        <div className="ai-toggle">
                            <fieldset className="ai-toggle_fieldset">
                                <div className="ai-toggle_container">
                                    <legend className="ai-toggle_legend">AI Service:</legend>
                                    <div className="ai-toggle_option">
                                        <input
                                            type="radio"
                                            id="claude"
                                            name="ai-selection"
                                            value="anthropic"
                                            checked={selectedAI === 'anthropic'}
                                            onChange={handleAIToggle}
                                            className="ai-toggle_radio-input"
                                        />
                                        <label className="mrgn-rght-15" htmlFor="claude">Anthropic</label>
                                    </div>
                                    <div className="flex-center">
                                        <input
                                            type="radio"
                                            id="chatgpt"
                                            name="ai-selection"
                                            value="openai"
                                            checked={selectedAI === 'openai'}
                                            onChange={handleAIToggle}
                                            className="ai-toggle_radio-input"
                                        />
                                        <label htmlFor="chatgpt">OpenAI</label>
                                    </div>
                                </div>
                            </fieldset>
                        </div>

                        <div className="language-toggle mrgn-bttm-20">
                            <fieldset className="ai-toggle_fieldset">
                                <div className="flex-center">
                                    <legend className="ai-toggle_legend">Evaluation Language:</legend>
                                    <div className="flex-center mrgn-rght-15">
                                        <input
                                            type="radio"
                                            id="english"
                                            name="language-selection"
                                            value="en"
                                            checked={selectedLanguage === 'en'}
                                            onChange={handleLanguageToggle}
                                            className="ai-toggle_radio-input"
                                        />
                                        <label className="mrgn-rght-15" htmlFor="english">English</label>
                                    </div>
                                    <div className="flex-center">
                                        <input
                                            type="radio"
                                            id="french"
                                            name="language-selection"
                                            value="fr"
                                            checked={selectedLanguage === 'fr'}
                                            onChange={handleLanguageToggle}
                                            className="ai-toggle_radio-input"
                                        />
                                        <label htmlFor="french">French</label>
                                    </div>
                                </div>
                            </fieldset>
                        </div>

                        <div className="batch-toggle mrgn-bttm-20">
                            <div className="flex-center">
                                <input
                                    type="checkbox"
                                    id="batchProcessing"
                                    checked={useBatchProcessing}
                                    onChange={handleBatchToggle}
                                    className="mrgn-rght-15"
                                />
                                <label htmlFor="batchProcessing">
                                    Use batch processing (recommended for large files)
                                </label>
                            </div>
                        </div>

                        <div className="file-input-container mrgn-bttm-20">
                            <label htmlFor="csvFile mrgn-bttm-10">
                                Select feedback CSV file:
                            </label>
                            <input
                                type="file"
                                id="csvFile"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="mrgn-bttm-10 display-block"
                            />
                            {file && (
                                <div>Selected file: {file.name}</div>
                            )}
                        </div>

                        {error && (
                            <div className="error-message mrgn-bttm-10 red">
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
                                {batchStatus === 'preparing' && selectedAI === 'openai' && (
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