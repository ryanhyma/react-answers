import React, { useState } from 'react';
import { GcdsCheckbox, GcdsInput, GcdsButton } from '@cdssnc/gcds-components-react';

const ExpertRatingComponent = ({ onSubmit }) => {
  const [expertFeedback, setExpertFeedback] = useState({
    veryIncorrect: false,
    somewhatIncorrect: false,
    incomplete: false,
    citationVeryIncorrect: false,
    citationSomewhatIncorrect: false,
    expertCitationUrl: '',
  });

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.detail;
    setExpertFeedback(prev => ({ ...prev, [name]: checked }));
  };

  const handleInputChange = (event) => {
    const { name, value } = event.detail;
    setExpertFeedback(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log('Submitting expert feedback:', expertFeedback);
    onSubmit(expertFeedback);
  };

  return (
    <form onSubmit={handleSubmit} className="expert-rating-container">
      <h3>Expert Rating</h3>
      <GcdsCheckbox
        checkboxId='veryIncorrect'
        label="Answer is very incorrect"
        name="veryIncorrect"
        value='veryIncorrect'
        onGcdsChange={handleCheckboxChange}
        checked={expertFeedback.veryIncorrect}
      />
      <GcdsCheckbox
        checkboxId='somewhatIncorrect'
        name="somewhatIncorrect"
        checked={expertFeedback.somewhatIncorrect}
        onGcdsChange={handleCheckboxChange}
        label="Answer is somewhat incorrect"
      />
      <GcdsCheckbox
        checkboxId='incomplete'
        name="incomplete"
        checked={expertFeedback.incomplete}
        onGcdsChange={handleCheckboxChange}
        label="Answer is incomplete"
      />
      <GcdsCheckbox
        checkboxId='citationVeryIncorrect'
        name="citationVeryIncorrect"
        checked={expertFeedback.citationVeryIncorrect}
        onGcdsChange={handleCheckboxChange}
        label="Citation URL is very incorrect"
      />
      <GcdsCheckbox
        checkboxId='citationSomewhatIncorrect'
        name="citationSomewhatIncorrect"
        checked={expertFeedback.citationSomewhatIncorrect}
        onGcdsChange={handleCheckboxChange}
        label="Citation URL is somewhat incorrect"
      />
      <GcdsInput
        inputId='expertCitationUrl'
        label="Correct citation URL (optional):"
        name="expertCitationUrl"
        value={expertFeedback.expertCitationUrl}
        onGcdsChange={handleInputChange}
      />
      <GcdsButton type="submit">Submit feedback</GcdsButton>
    </form>
  );
};

export default ExpertRatingComponent;