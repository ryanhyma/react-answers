import React from 'react';
import { GcdsContainer, GcdsText, GcdsLink } from '@cdssnc/gcds-components-react';
import { useTranslation } from '../hooks/useTranslations';
import ChatLogsDashboard from '../components/admin/ChatLogsDashboard';

const LogPage = () => {
  const { t } = useTranslation();

  return (
    <GcdsContainer size="xl" mainContainer centered tag="main" className="mb-600">
      <h1 className='mb-400'>Chat Logs</h1>
      <nav className="mb-400" aria-label="On this page">
        <h2 className='mt-400 mb-400'>On this page</h2>
        <ul>
          <li className="mb-400">
            <GcdsText>
              <GcdsLink href="#debug-logs">Debug Logs</GcdsLink>
            </GcdsText>
          </li>
          <li className="mb-400">
            <GcdsText>
              <GcdsLink href={`/admin`}>Back to Admin</GcdsLink>
            </GcdsText>
          </li>
        </ul>
      </nav>

      <section id="debug-logs" className="mb-600">
        <h2 className='mt-400 mb-400'>Debug Logs</h2>
        <ChatLogsDashboard />
      </section>
    </GcdsContainer>
  );
};

export default LogPage;