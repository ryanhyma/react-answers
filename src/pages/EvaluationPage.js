import React from 'react';
// import { useTranslations } from '../hooks/useTranslations';
import { GcdsContainer, GcdsText, GcdsLink, GcdsCheckbox, GcdsTextarea, GcdsButton, GcdsDetails } from '@cdssnc/gcds-components-react';
import Evaluator from '../components/eval/Evaluator.js';
import BatchList from '../components/eval/BatchList.js';


const EvaluationPage = ({ lang = 'en' }) => {
  // const { t } = useTranslations(lang);  //TODO: uncomment this when we have translations for this page 
  const [status, setStatus] = React.useState({
    isAvailable: true,
    message: ''
  });

  const handleDownloadClick = (batchId) => {
    console.log('Button clicked for batch:', batchId);
    // Implement your action logic here
  };

  const handleCompleteClick = (batchId) => {
    console.log('Button clicked to complete batch:', batchId);
    // Implement your action logic here
  };

  const handleStatusToggle = () => {
    setStatus({ ...status, isAvailable: !status.isAvailable });
  };

  const handleMessageChange = (e) => {
    setStatus({ ...status, message: e.target.value });
  };

  const handleStatusUpdate = () => {
    // Implement status update logic here
  };

  return (
    <GcdsContainer size="xl" mainContainer centered tag="main" className="mb-600">
      <h1 className='mb-400'>Evaluation</h1>
      <nav className="mb-400" aria-label="On this page">
        <h2 className='mt-400 mb-400'>On this page</h2>
        <ul>
          <li className="mb-400">
            <GcdsText>
              <GcdsLink href="#evaluator">New Evaluation</GcdsLink>
            </GcdsText>
          </li>
          <li className="mb-400">
            <GcdsText>
              <GcdsLink href="#continue-evaluation">Update evaluation from batch</GcdsLink>
            </GcdsText>
          </li>
          <li className="mb-400">
            <GcdsText>
              <GcdsLink href="#download-evaluation">Download evalutation results</GcdsLink>
            </GcdsText>
          </li>
        </ul>
      </nav>

      <section id="evaluator" className="mb-600">
        <h2 className='mt-400 mb-400'>Load and run evaluation</h2>
        <Evaluator />
      </section>

      <section id="running-evaluation" className="mb-600">
        <h2 className='mt-400 mb-400'>Running Batches</h2>
        <BatchList 
        buttonLabel="Complete"
        buttonAction={handleCompleteClick}
        batchStatus="completed" />
      </section>

      <section id="processed-evaluation" className="mb-600">
        <h2 className='mt-400 mb-400'>Processed Batches</h2>
        <BatchList 
        buttonLabel="Complete"
        buttonAction={handleDownloadClick}
        batchStatus="processed" />
      </section>

    </GcdsContainer>
  );
};

export default EvaluationPage;