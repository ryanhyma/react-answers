import React, { useState } from 'react';
import { GcdsFieldset } from '@cdssnc/gcds-components-react'
import '../../styles/ExpertRatingPlain.css';
import { useTranslations } from '../../hooks/useTranslations';

const ExpertRatingComponent = ({ onSubmit, lang = 'en' }) => {
  const { t } = useTranslations(lang);
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
        legend={t('homepage.expertRating.title')}
        hint={t('homepage.expertRating.hint')}
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
            {t('homepage.expertRating.options.veryIncorrect')}
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
            {t('homepage.expertRating.options.somewhatIncorrect')}
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
            {t('homepage.expertRating.options.incomplete')}
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
            {t('homepage.expertRating.options.citationVeryIncorrect')}
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
            {t('homepage.expertRating.options.citationSomewhatIncorrect')}
          </label>
        </div>
        <div>
          <label>
            {t('homepage.expertRating.options.betterCitation')}
            <input
              type="text"
              name="expertCitationUrl"
              value={expertFeedback.expertCitationUrl}
              onChange={handleInputChange}
            />
          </label>
        </div>
      </GcdsFieldset>
      <button type="submit">{t('homepage.expertRating.submit')}</button>
    </form>
  );
};

export default ExpertRatingComponent;