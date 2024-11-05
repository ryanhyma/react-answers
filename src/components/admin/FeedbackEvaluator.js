// src/components/admin/FeedbackEvaluator.js
import React, { useState } from 'react';
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

const FeedbackEvaluator = () => {
    const [file, setFile] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [processedCount, setProcessedCount] = useState(0);
    const [totalEntries, setTotalEntries] = useState(0);
    const [selectedAI, setSelectedAI] = useState('claude');
    const [fileUploaded, setFileUploaded] = useState(false);

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

            // Parse just what we need for logging
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

    const handleProcessFile = async () => {
        if (!file) return;

        setProcessing(true);
        setError(null);
        setProcessedCount(0);

        try {
            const text = await file.text();
            const entries = processCSV(text);
            setTotalEntries(entries.length);

            if (entries.length === 0) {
                throw new Error('No valid entries found in the CSV file');
            }

            for (const entry of entries) {
                await processEntry(entry);
            }

            setResults({
                fileName: file.name,
                size: file.size,
                entriesProcessed: entries.length
            });

        } catch (err) {
            setError(err.message);
            console.error('Error processing file:', err);
        } finally {
            setProcessing(false);
        }
    };

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
                    </form>

                    {fileUploaded && (
                        <div className="step mt-400">
                            <GcdsHeading tag="h3">Step 2: Process File</GcdsHeading>
                            <button
                                onClick={handleProcessFile}
                                disabled={processing}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#26374a',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: processing ? 'not-allowed' : 'pointer',
                                    opacity: processing ? 0.7 : 1
                                }}
                            >
                                {processing ? 'Processing...' : 'Start Processing'}
                            </button>
                        </div>
                    )}

                    {processing && (
                        <div className="processing-status mt-400">
                            <GcdsText>Processing entries: {processedCount} of {totalEntries}</GcdsText>
                        </div>
                    )}

                    {results && (
                        <div className="results-section mt-400">
                            <GcdsHeading tag="h3">Processing Complete</GcdsHeading>
                            <GcdsText>File: {results.fileName}</GcdsText>
                            <GcdsText>Entries processed: {results.entriesProcessed}</GcdsText>
                        </div>
                    )}
                </div>
            </div>
        </GcdsContainer>
    );
};

export default FeedbackEvaluator;