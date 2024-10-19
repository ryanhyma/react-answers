import React, { useState } from 'react';
import { GcdsFieldset } from '@cdssnc/gcds-components-react'
import './ExpertRatingPlain.css';

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
    const { name, checked } = event.target;
    setExpertFeedback(prev => ({ ...prev, [name]: checked }));
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setExpertFeedback(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log('Submitting expert feedback:', expertFeedback);
    onSubmit(expertFeedback);
  };

  return (
    <form onSubmit={handleSubmit} className="expert-rating-container">
      <GcdsFieldset
          legend="Why wasn't this answer helpful?"
          hint="Select all that apply"
          fieldsetId="ratings"
          className="mt-400"
        >
      <div>
        <label>
          <input
            type="checkbox"
            name="veryIncorrect"
            checked={expertFeedback.veryIncorrect}
            onChange={handleCheckboxChange}
          />
          Answer is very incorrect
        </label>
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            name="somewhatIncorrect"
            checked={expertFeedback.somewhatIncorrect}
            onChange={handleCheckboxChange}
          />
          Answer is somewhat incorrect
        </label>
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            name="incomplete"
            checked={expertFeedback.incomplete}
            onChange={handleCheckboxChange}
          />
          Answer is incomplete
        </label>
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            name="citationVeryIncorrect"
            checked={expertFeedback.citationVeryIncorrect}
            onChange={handleCheckboxChange}
          />
          Citation URL is very incorrect
        </label>
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            name="citationSomewhatIncorrect"
            checked={expertFeedback.citationSomewhatIncorrect}
            onChange={handleCheckboxChange}
          />
          Citation URL is somewhat incorrect
        </label>
      </div>
      <div>
        <label>
          Better citation URL (optional):
          <input
            type="text"
            name="expertCitationUrl"
            value={expertFeedback.expertCitationUrl}
            onChange={handleInputChange}
          />
        </label>
      </div>
      </GcdsFieldset>
      <button type="submit">Submit feedback</button>
    </form>
  );
};

export default ExpertRatingComponent;