import React, { useState } from 'react';
import { GcdsButton } from '@cdssnc/gcds-components-react';

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
      <GcdsButton classname="me-400 hydrated" onClick={() => handleFeedback(true)}>👍 Yes</GcdsButton>
      <GcdsButton classname="me-400 hydrated" onClick={() => handleFeedback(false)}>👎 No</GcdsButton>
      <a href="/survey" className="feedback-survey-link">Give feedback</a>
    </div>
  );
};

export default FeedbackComponent;