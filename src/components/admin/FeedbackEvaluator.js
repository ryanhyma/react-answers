// src/components/admin/FeedbackEvaluator.js
import React, { useState } from 'react';
import {
    GcdsButton,
    GcdsText,
    GcdsFileUploader,
    GcdsContainer,
    GcdsHeading
} from '@cdssnc/gcds-components-react';
import LoggingService from '../../services/LoggingService';
import ClaudeService from '../../services/ClaudeService';
import RedactionService from '../../services/RedactionService';

const FeedbackEvaluator = () => {
    const [file, setFile] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [processedCount, setProcessedCount] = useState(0);
    const [totalEntries, setTotalEntries] = useState(0);
    const [fileValue, setFileValue] = useState('');
    const [fileUploaded, setFileUploaded] = useState(false);

    const handleFileChange = (event) => {
        console.log('File change event:', event); // Debug log
        
        // GcdsFileUploader passes the file in event.target.value
        if (!event || !event.target) {
            console.error('Invalid event object');
            return;
        }
    
        // Get the FileList from the input element
        const fileInput = event.target;
        console.log('File input:', fileInput); // Debug log
    
        // Check if we have a file selected
        if (!fileInput.files || fileInput.files.length === 0) {
            console.log('No file selected');
            setFile(null);
            setFileValue('');
            setError('No file selected');
            return;
        }
    
        const uploadedFile = fileInput.files[0];
        console.log('Uploaded file:', uploadedFile); // Debug log
    
        if (!uploadedFile.name.endsWith('.csv')) {
            setError('Please upload a CSV file that you downloaded from the Feedback Viewer');
            return;
        }
    
        setFile(uploadedFile);
        setFileValue(uploadedFile.name);
        setError(null);
        setResults(null);
        setProcessedCount(0);
        setFileUploaded(false);
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file first');
            return;
        }

        try {
            // Verify the file can be read
            await file.text();
            setFileUploaded(true);
            setError(null);
        } catch (err) {
            setError('Failed to read the file. Please try uploading again.');
            console.error('Error reading file:', err);
        }
    };

    const processCSV = (csvText) => {
        try {
            const lines = csvText.split('\n');
            const headers = lines[0].split(',');

            console.log('CSV Headers:', headers); // For debugging

            // Find indexes for the specific columns we need
            const problemDetailsIndex = headers.findIndex(h => h === 'Problem Details');
            const urlIndex = headers.findIndex(h => h === 'URL');

            if (problemDetailsIndex === -1 || urlIndex === -1) {
                throw new Error('Required columns "Problem Details" and "URL" not found in CSV file. Please ensure you are using a file downloaded from the Feedback Viewer.');
            }

            console.log('Found columns - Problem Details:', problemDetailsIndex, 'URL:', urlIndex); // For debugging

            // Process each line into structured data
            const entries = lines.slice(1)
                .filter(line => line.trim()) // Remove empty lines
                .map((line) => {
                    // Split the line, handling possible commas within quoted values
                    const columns = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];

                    // Remove quotes and trim values
                    const cleanColumns = columns.map(col => col.replace(/^"|"$/g, '').trim());

                    const entry = {
                        question: cleanColumns[problemDetailsIndex] || '',
                        referringUrl: cleanColumns[urlIndex] || ''
                    };

                    console.log('Processed entry:', entry); // For debugging
                    return entry;
                })
                .filter(item => item.question && item.referringUrl); // Remove items with missing data

            console.log('Total valid entries found:', entries.length); // For debugging
            return entries;
        } catch (error) {
            console.error('Error processing CSV:', error);
            throw new Error(`Failed to process CSV file: ${error.message}`);
        }
    };

    const processEntry = async (entry) => {
        try {
            // Redact the question
            const { redactedText } = RedactionService.redactText(entry.question);

            // Add referring URL to the message
            const messageWithUrl = `${redactedText}\n<referring-url>${entry.referringUrl}</referring-url>`;

            // Get AI response
            const aiResponse = await ClaudeService.sendMessage(messageWithUrl);

            // Create log entry
            const logEntry = {
                originalQuestion: entry.question,
                redactedQuestion: redactedText,
                aiResponse,
                aiService: 'claude',
                referringUrl: entry.referringUrl
            };

            // Log the interaction
            await LoggingService.logInteraction(logEntry, true); // true indicates this is an evaluation

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

            // Process entries sequentially
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
            <GcdsHeading tag="h2">Process Feedback CSV File</GcdsHeading>

            <div className="steps-container">
                <div className="step">
                    <GcdsHeading tag="h3">Step 1: Select and Upload File</GcdsHeading>
                    <GcdsText>Select a CSV file that you've downloaded from the Feedback viewer.</GcdsText>

                    <div className="file-upload-section">
    <GcdsFileUploader
        uploaderId="feedbackUploader"
        label="Select feedback CSV file"
        hint="Only CSV files are accepted"
        accept=".csv"
        required={true}
        onGcdsInput={handleFileChange}  // Using onGcdsInput instead of onInput
        value={fileValue}
    />
    
    {file && !fileUploaded && (
        <div className="upload-button-container mt-400">
            <GcdsButton
                type="button"
                buttonRole="primary"  // Using buttonRole instead of button-role
                onClick={handleUpload}
            >
                Upload the file
            </GcdsButton>
        </div>
    )}
</div>

                    {file && !fileUploaded && (
                        <GcdsButton type="submit" onClick={handleUpload}>
                            Upload the file
                        </GcdsButton>
                    )}
                </div>

                {fileUploaded && (
                    <div className="step">
                        <GcdsHeading tag="h3">Step 2: Process File</GcdsHeading>
                        <GcdsText>Ready to process: {file.name}</GcdsText>
                        <GcdsButton
                            onClick={handleProcessFile}
                            disabled={processing}
                        >
                            {processing ? 'Processing...' : 'Start Processing'}
                        </GcdsButton>
                    </div>
                )}

                {error && (
                    <div className="error-message mt-400">
                        <GcdsText>{error}</GcdsText>
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
        </GcdsContainer>
    );
};

export default FeedbackEvaluator;