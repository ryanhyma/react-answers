import React, { useState, useEffect, useRef } from 'react';
import { getApiUrl } from '../utils/apiToUrl.js';
import { GcdsContainer, GcdsText, GcdsButton } from '@cdssnc/gcds-components-react';


const EvalPage = () => {
  const [embeddingProgress, setEmbeddingProgress] = useState(null);
  const [evalProgress, setEvalProgress] = useState(null);
  const [isAutoProcessingEmbeddings, setIsAutoProcessingEmbeddings] = useState(false);
  const [isAutoProcessingEvals, setIsAutoProcessingEvals] = useState(false);
  const [evalLastProcessedId, setEvalLastProcessedId] = useState(null);
  const embeddingIntervalRef = useRef(null);
  const evalIntervalRef = useRef(null);

  // Clean up intervals on component unmount
  useEffect(() => {
    return () => {
      if (embeddingIntervalRef.current) clearInterval(embeddingIntervalRef.current);
      if (evalIntervalRef.current) clearInterval(evalIntervalRef.current);
    };
  }, []);

  const handleGenerateEmbeddings = async (isAutoProcess = false) => {
    if (!isAutoProcess) {
      // Clear any existing interval when manually triggered
      if (embeddingIntervalRef.current) {
        clearInterval(embeddingIntervalRef.current);
        embeddingIntervalRef.current = null;
      }
      setIsAutoProcessingEmbeddings(false);
    }

    setEmbeddingProgress(prev => ({ ...prev, loading: true }));
    try {
      const response = await fetch(getApiUrl('db-generate-embeddings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate embeddings');
      }

      const result = await response.json();
      setEmbeddingProgress({
        completed: result.completed,
        total: result.total,
        remaining: result.remaining,
        duration: result.duration,
        loading: false
      });
      
      if (result.remaining > 0) {
        if (!isAutoProcess) {
          // If not already auto-processing, ask user if they want to continue
          const shouldContinue = window.confirm(
            `Processed ${result.completed} interactions in ${result.duration} seconds. ${result.remaining} remaining. Do you want to continue processing automatically?`
          );
          
          if (shouldContinue) {
            setIsAutoProcessingEmbeddings(true);
            // Set up interval to keep processing (every 3 seconds)
            embeddingIntervalRef.current = setInterval(() => {
              handleGenerateEmbeddings(true);
            }, 3000);
          }
        }
      } else {
        // No more items to process, clear interval
        if (embeddingIntervalRef.current) {
          clearInterval(embeddingIntervalRef.current);
          embeddingIntervalRef.current = null;
        }
        setIsAutoProcessingEmbeddings(false);
        
      }
    } catch (error) {
      console.error('Error generating embeddings:', error);
      if (!isAutoProcess) {
        alert('Failed to generate embeddings. Check the console for details.');
      }
      // Stop auto-processing on error
      if (embeddingIntervalRef.current) {
        clearInterval(embeddingIntervalRef.current);
        embeddingIntervalRef.current = null;
      }
      setIsAutoProcessingEmbeddings(false);
      setEmbeddingProgress(prev => ({ ...prev, loading: false }));
    }
  };

  const handleGenerateEvals = async (isAutoProcess = false) => {
    if (!isAutoProcess) {
      // Clear any existing interval when manually triggered
      if (evalIntervalRef.current) {
        clearInterval(evalIntervalRef.current);
        evalIntervalRef.current = null;
      }
      setIsAutoProcessingEvals(false);
      setEvalLastProcessedId(null); // Reset last processed ID when starting fresh
    }

    setEvalProgress(prev => ({ ...prev, loading: true }));
    try {
      const response = await fetch(getApiUrl('db-generate-evals'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lastProcessedId: evalLastProcessedId })
      });

      if (!response.ok) {
        throw new Error('Failed to generate evals');
      }

      const result = await response.json();
      setEvalLastProcessedId(result.lastProcessedId);
      setEvalProgress({
        remaining: result.remaining,
        loading: false
      });
      
      if (result.remaining > 0) {
        if (!isAutoProcess) {
          // If not already auto-processing, ask user if they want to continue
          const shouldContinue = window.confirm(
            `${result.remaining} evaluations remaining to process. Do you want to continue processing automatically?`
          );
          
          if (shouldContinue) {
            setIsAutoProcessingEvals(true);
            // Set up interval to keep processing (every 3 seconds)
            evalIntervalRef.current = setInterval(() => {
              handleGenerateEvals(true);
            }, 3000);
          }
        }
      } else {
        // No more items to process, clear interval and reset lastProcessedId
        if (evalIntervalRef.current) {
          clearInterval(evalIntervalRef.current);
          evalIntervalRef.current = null;
        }
        setIsAutoProcessingEvals(false);
        setEvalLastProcessedId(null);
        if (!isAutoProcess) {
          alert('All evaluations have been generated!');
        }
      }
    } catch (error) {
      console.error('Error generating evals:', error);
      if (!isAutoProcess) {
        alert('Failed to generate evals. Check the console for details.');
      }
      // Stop auto-processing on error
      if (evalIntervalRef.current) {
        clearInterval(evalIntervalRef.current);
        evalIntervalRef.current = null;
      }
      setIsAutoProcessingEvals(false);
      setEvalProgress(prev => ({ ...prev, loading: false }));
    }
  };

  const stopAutoProcessingEmbeddings = () => {
    if (embeddingIntervalRef.current) {
      clearInterval(embeddingIntervalRef.current);
      embeddingIntervalRef.current = null;
    }
    setIsAutoProcessingEmbeddings(false);
  };

  const stopAutoProcessingEvals = () => {
    if (evalIntervalRef.current) {
      clearInterval(evalIntervalRef.current);
      evalIntervalRef.current = null;
    }
    setIsAutoProcessingEvals(false);
  };

  const handleProcessInteractions = async () => {
    try {
      const response = await fetch(getApiUrl('db-process-interactions'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to process interactions');
      }

      const result = await response.json();
      alert(`Processed ${result.completed} interactions out of ${result.total}. ${result.remaining || 0} remaining.`);
    } catch (error) {
      console.error('Error processing interactions:', error);
      alert('Failed to process interactions. Check the console for details.');
    }
  };

  return (
    <GcdsContainer size="xl" centered>
      <h1>Evaluation Tools</h1>
      
      <div className="mb-400">
        <h2>Generate Embeddings</h2>
        <GcdsText>
          Process interactions to generate embeddings.
        </GcdsText>
        <div className="button-group">
          <GcdsButton 
            onClick={() => handleGenerateEmbeddings(false)}
            disabled={embeddingProgress?.loading || isAutoProcessingEmbeddings}
            className="mb-200 mr-200"
          >
            {embeddingProgress?.loading && !isAutoProcessingEmbeddings ? 'Processing...' : 'Generate Embeddings'}
          </GcdsButton>
          
          {isAutoProcessingEmbeddings && (
            <GcdsButton 
              onClick={stopAutoProcessingEmbeddings}
              variant="secondary"
              className="mb-200"
            >
              Stop Auto-Processing
            </GcdsButton>
          )}
        </div>
        
        {embeddingProgress && (
          <div className="mb-200">
            <p>
              Processed: {embeddingProgress.completed} / {embeddingProgress.total}
              {embeddingProgress.remaining !== undefined && (
                <span> • Remaining: {embeddingProgress.remaining}</span>
              )}
              {isAutoProcessingEmbeddings && (
                <span> • <strong>Auto-processing active</strong></span>
              )}
            </p>
          </div>
        )}
      </div>
      
      <div className="mb-400">
        <h2>Generate Evaluations</h2>
        <GcdsText>
          Process interactions to generate evaluations.
        </GcdsText>
        <div className="button-group">
          <GcdsButton 
            onClick={() => handleGenerateEvals(false)}
            disabled={evalProgress?.loading || isAutoProcessingEvals}
            className="mb-200 mr-200"
          >
            {evalProgress?.loading && !isAutoProcessingEvals ? 'Processing...' : 'Generate Evaluations'}
          </GcdsButton>
          
          {isAutoProcessingEvals && (
            <GcdsButton 
              onClick={stopAutoProcessingEvals}
              variant="secondary"
              className="mb-200"
            >
              Stop Auto-Processing
            </GcdsButton>
          )}
        </div>
        
        {evalProgress && (
          <div className="mb-200">
            <p>
              Processed: {evalProgress.completed} / {evalProgress.total}
              {evalProgress.successful !== undefined && (
                <span> • Successful: {evalProgress.successful}</span>
              )}
              {evalProgress.remaining !== undefined && (
                <span> • Remaining: {evalProgress.remaining}</span>
              )}
              {isAutoProcessingEvals && (
                <span> • <strong>Auto-processing active</strong></span>
              )}
            </p>
          </div>
        )}
      </div>
    </GcdsContainer>
  );
};

export default EvalPage;