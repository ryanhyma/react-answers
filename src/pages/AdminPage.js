import React from 'react';
import { GcdsContainer, GcdsText, GcdsLink } from '@cdssnc/gcds-components-react';
import FeedbackEvaluator from '../components/admin/FeedbackEvaluator';
import ChatLogsDashboard from '../components/admin/ChatLogsDashboard';

const AdminPage = () => {
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
              <GcdsLink href="/">Use the app</GcdsLink>
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
    </GcdsContainer>
  );
};

export default AdminPage;