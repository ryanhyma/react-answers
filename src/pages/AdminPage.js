import React from 'react';
// import { useTranslations } from '../hooks/useTranslations';
import { GcdsContainer, GcdsText, GcdsLink, GcdsCheckbox, GcdsTextarea, GcdsButton, GcdsDetails } from '@cdssnc/gcds-components-react';
import FeedbackEvaluator from '../components/admin/FeedbackEvaluator';
import ChatLogsDashboard from '../components/admin/ChatLogsDashboard';

const AdminPage = ({ lang = 'en' }) => {
  // const { t } = useTranslations(lang);  //TODO: uncomment this when we have translations for this page 
  const [status, setStatus] = React.useState({
    isAvailable: true,
    message: ''
  });

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
              <GcdsLink href="#chat-logs">Download chat logs</GcdsLink>
            </GcdsText>
          </li>
          <li className="mb-400">
            <GcdsText>
              <GcdsLink href="#evaluator">Load and run evaluation</GcdsLink>
            </GcdsText>
          </li>
          <li className="mb-400">
            <GcdsText>
              <GcdsLink href={`/${lang}`}>Use the app</GcdsLink>
            </GcdsText>
          </li>
        </ul>
      </nav>

      <section id="chat-logs" className="mb-600">
        <h2 className='mt-400 mb-400'>Chat interaction logs</h2>
        <ChatLogsDashboard />
      </section>

      <section id="evaluator" className="mb-600">
        <h2 className='mt-400 mb-400'>Load and run evaluation</h2>
        <FeedbackEvaluator />
      </section>

      <GcdsDetails detailsTitle="Service Status Control" className="mb-600">
        <div className="status-control-section">
          <div className="status-toggle">
            <GcdsCheckbox
              label="Service Available"
              checked={status.isAvailable}
              onChange={handleStatusToggle}
            />
          </div>
          
          <GcdsTextarea
            label="Status Message"
            value={status.message}
            onChange={handleMessageChange}
            placeholder="Enter status message to display to users..."
            disabled={status.isAvailable}
            className="mt-400"
          />
          
          <GcdsButton onClick={handleStatusUpdate} className="mt-400">
            Update Status
          </GcdsButton>
        </div>
      </GcdsDetails>
    </GcdsContainer>
  );
};

export default AdminPage;