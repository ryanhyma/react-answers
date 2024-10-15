import React, { useState } from 'react';
import { GcdsButton } from '@cdssnc/gcds-components-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp, faThumbsDown } from '@fortawesome/free-regular-svg-icons';

const FeedbackComponent = ({ onFeedback }) => {
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const handleFeedback = (isPositive) => {
    onFeedback(isPositive);
    setFeedbackGiven(true);
  };

  if (feedbackGiven) {
    return <p>Thank you for your feedback!</p>;
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
      <a href="/survey" className="feedback-survey-link">Give feedback</a>
    </div>
  );
};

export default FeedbackComponent;
