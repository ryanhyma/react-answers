// src/components/admin/FeedbackEvaluator.js
import React, { useState } from 'react';
import { 
  GcdsButton, 
  GcdsText,
  GcdsFileUploader, GcdsContainer
} from '@cdssnc/gcds-components-react';

const FeedbackEvaluator = () => {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setFile(uploadedFile);
    setError(null);
  };

  const handleProcessFile = async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);

    try {
      const text = await file.text();
      // Process CSV file content here
      console.log('Processing file:', file.name);
      setResults({ fileName: file.name, size: file.size });
      
    } catch (err) {
      setError(err.message);
      console.error('Error processing file:', err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <GcdsContainer className="mb-600" >
      <GcdsText>Download a feedback CSV file from the Feedback viewer. Upload it to process questions and generate AI answers. Results will appear in the database.</GcdsText>
      
      <div className="file-upload-section">
        <GcdsFileUploader
          id="feedback-file"
          name="feedback-file"
          label="Select feedback CSV file"
          hint="Only CSV files are accepted"
          accept=".csv"
          required={true}
          onGcdsChange={handleFileChange}
        />
      </div>

      {file && (
        <div className="file-info">
          <GcdsText>Selected file: {file.name}</GcdsText>
          <GcdsButton onClick={handleProcessFile} disabled={processing}>
            {processing ? 'Processing...' : 'Process Feedback File'}
          </GcdsButton>
        </div>
      )}

      {error && (
        <div className="error-message">
          <GcdsText>{error}</GcdsText>
        </div>
      )}

      {results && (
        <div className="results-section">
          <GcdsText>File processed successfully!</GcdsText>
          <GcdsText>File: {results.fileName}</GcdsText>
          <GcdsText>Size: {results.size} bytes</GcdsText>
        </div>
      )}
    </GcdsContainer>
  );
};

export default FeedbackEvaluator;