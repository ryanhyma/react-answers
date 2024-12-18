import React, { useState } from 'react';
import { GcdsFieldset } from '@cdssnc/gcds-components-react';
import '../../styles/App.css';
import { useTranslations } from '../../hooks/useTranslations.js';

// TODO: Only show checkb sentences 2-4 if those sente

const ExpertRatingComponent = ({ onSubmit, lang = 'en' }) => {
  const { t } = useTranslations(lang);
  const [expertFeedback, setExpertFeedback] = useState({
    incomplete: false,
    sentence1Incorrect: false,
    sentence2Incorrect: false,
    sentence3Incorrect: false,
    sentence4Incorrect: false,
    citationIncorrect: false,
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
    
    if (expertFeedback.expertCitationUrl && !isValidGovernmentUrl(expertFeedback.expertCitationUrl)) {
      alert(t('homepage.expertRating.errors.invalidUrl'));
      return;
    }
    
    console.log('Submitting expert feedback:', expertFeedback);
    onSubmit(expertFeedback);
  };

  const isValidGovernmentUrl = (url) => {
    try {
      const urlObject = new URL(url);
      return urlObject.hostname.includes('canada.ca') || 
             urlObject.hostname.includes('gc.ca');
    } catch {
      return false;
    }
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
              name="sentence1Incorrect"
              checked={expertFeedback.sentence1Incorrect}
              onChange={handleCheckboxChange}
            />
            {t('homepage.expertRating.options.sentence1Incorrect')}
          </label>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              name="sentence2Incorrect"
              checked={expertFeedback.sentence2Incorrect}
              onChange={handleCheckboxChange}
            />
            {t('homepage.expertRating.options.sentence2Incorrect')}
          </label>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              name="sentence3Incorrect"
              checked={expertFeedback.sentence3Incorrect}
              onChange={handleCheckboxChange}
            />
            {t('homepage.expertRating.options.sentence3Incorrect')}
          </label>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              name="sentence4Incorrect"
              checked={expertFeedback.sentence4Incorrect}
              onChange={handleCheckboxChange}
            />
            {t('homepage.expertRating.options.sentence4Incorrect')}
          </label>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              name="citationIncorrect"
              checked={expertFeedback.citationIncorrect}
              onChange={handleCheckboxChange}
            />
            {t('homepage.expertRating.options.citationIncorrect')}
          </label>
        </div>
        <div>
          <label>
            {t('homepage.expertRating.options.betterCitation')}
            <input
              type="url"
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