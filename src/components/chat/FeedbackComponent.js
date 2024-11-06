import React, { useState } from 'react';
import ExpertRatingComponent from './ExpertRatingComponent';
import '../../styles/ExpertRatingPlain.css';

const FeedbackComponent = ({ onFeedback }) => {
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [showExpertRating, setShowExpertRating] = useState(false);

  const handleFeedback = (isPositive) => {
    if (isPositive) {
      onFeedback(true);
      setFeedbackGiven(true);
    } else {
      setShowExpertRating(true);
    }
  };

  const handleExpertFeedback = (expertFeedback) => {
    console.log('Expert feedback received:', expertFeedback);
    onFeedback(false, expertFeedback);
    setFeedbackGiven(true);
    setShowExpertRating(false);
  };

  if (feedbackGiven) {
    return <p>Thank you for your feedback!</p>;
  }
  if (showExpertRating) {
    return <ExpertRatingComponent onSubmit={handleExpertFeedback} />;
  }
  return (
    <div className="feedback-container">
      <span className="feedback-text">How was this answer? </span>
      <button 
        className="feedback-link button-as-link"
        onClick={() => handleFeedback(true)}
      >
        Useful
      </button>
      <span className="feedback-separator"> · </span>
      <span className="feedback-text">or</span>
      <span className="feedback-separator"> · </span>
      <button 
        className="feedback-link button-as-link"
        onClick={() => handleFeedback(false)}
      >
        not useful
      </button>
    </div>
  );
};

export default FeedbackComponent;