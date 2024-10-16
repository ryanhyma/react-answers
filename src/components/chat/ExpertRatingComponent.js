import React, { useState } from 'react';
import { GcdsCheckbox, GcdsInput, GcdsButton } from '@cdssnc/gcds-components-react';

const ExpertRatingComponent = ({ onSubmit }) => {
  const [expertFeedback, setExpertFeedback] = useState({
    veryIncorrect: false,
    somewhatIncorrect: false,
    incomplete: false,
    citationVeryIncorrect: false,
    citationSomewhatIncorrect: false,
    citationShouldReplace: false,
    expertCitationUrl: '',
  });

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setExpertFeedback(prev => ({ ...prev, [name]: checked }));
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setExpertFeedback(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onSubmit(expertFeedback);
  };

  return (
    <div className="expert-rating-container">
      <h3>Expert Rating</h3>
      <GcdsCheckbox
        name="veryIncorrect"
        checked={expertFeedback.veryIncorrect}
        onGcdsChange={handleCheckboxChange}
        label="Answer is very incorrect"
      />
      <GcdsCheckbox
        name="somewhatIncorrect"
        checked={expertFeedback.somewhatIncorrect}
        onGcdsChange={handleCheckboxChange}
        label="Answer is somewhat incorrect"
      />
      <GcdsCheckbox
        name="incomplete"
        checked={expertFeedback.incomplete}
        onGcdsChange={handleCheckboxChange}
        label="Answer is incomplete"
      />
      <GcdsCheckbox
        name="citationVeryIncorrect"
        checked={expertFeedback.citationVeryIncorrect}
        onGcdsChange={handleCheckboxChange}
        label="Citation URL is very incorrect"
      />
      <GcdsCheckbox
        name="citationSomewhatIncorrect"
        checked={expertFeedback.citationSomewhatIncorrect}
        onGcdsChange={handleCheckboxChange}
        label="Citation URL is somewhat incorrect"
      />
      <GcdsCheckbox
        name="citationShouldReplace"
        checked={expertFeedback.citationShouldReplace}
        onGcdsChange={handleCheckboxChange}
        label="Citation URL should be replaced"
      />
      <GcdsInput
        name="expertCitationUrl"
        value={expertFeedback.expertCitationUrl}
        onGcdsChange={handleInputChange}
        label="Correct citation URL (optional):"
      />
      <GcdsButton onClick={handleSubmit}>Submit Expert Feedback</GcdsButton>
    </div>
  );
};

export default ExpertRatingComponent;