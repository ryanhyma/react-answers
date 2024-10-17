import React, { useState } from 'react';
import { GcdsButton } from '@cdssnc/gcds-components-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp, faThumbsDown } from '@fortawesome/free-regular-svg-icons';
import ExpertRatingComponent from './ExpertRatingComponent';

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
      <p>Was this response helpful?</p>
      <GcdsButton className="me-400 hydrated" onClick={() => handleFeedback(true)}>
        <FontAwesomeIcon icon={faThumbsUp} /> Yes
      </GcdsButton>
      <GcdsButton className="me-400 hydrated" onClick={() => handleFeedback(false)}>
        <FontAwesomeIcon icon={faThumbsDown} /> No
      </GcdsButton>
      <a href="/survey" className="feedback-survey-link">Give feedback - not implemented yet</a>
    </div>
  );
};

export default FeedbackComponent;