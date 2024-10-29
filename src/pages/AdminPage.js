import React from 'react';
import { GcdsContainer } from '@cdssnc/gcds-components-react';
import FeedbackEvaluator from '../components/admin/FeedbackEvaluator';
import ChatLogsDashboard from '../components/admin/ChatLogsDashboard';

const AdminPage = () => {
  return (
    <GcdsContainer size="xl" mainContainer centered tag="main" className="mb-600">
      <nav className="mb-8" aria-label="On this page">
        <h2 className="text-xl font-bold mb-4">On this page</h2>
        <ul>
          <li className="mb-2">
            <a href="#chat-logs" className="text-blue-700 hover:underline">Chat Interaction Logs</a>
          </li>
          <li className="mb-2">
            <a href="#evaluator" className="text-blue-700 hover:underline">Feedback Evaluator</a>
          </li>
        </ul>
      </nav>

      <section id="chat-logs" className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Chat Interaction Logs</h2>
        <ChatLogsDashboard />
      </section>

      <section id="evaluator">
        <h2 className="text-2xl font-bold mb-6">Feedback Evaluator</h2>
        <FeedbackEvaluator />
      </section>
    </GcdsContainer>
  );
};

export default AdminPage;