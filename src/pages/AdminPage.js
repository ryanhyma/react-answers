import React from 'react';
import { useTranslation } from '../hooks/useTranslations';
import { GcdsContainer, GcdsText, GcdsLink } from '@cdssnc/gcds-components-react';
import ChatLogsDashboard from '../components/admin/ChatLogsDashboard';
import DatabaseLogs from '../components/admin/DatabaseLogs';
import { usePageParam } from '../hooks/usePageParam';

const AdminPage = () => {
  const { t } = useTranslation();
  const { lang } = usePageParam();

  return (
    <GcdsContainer size="xl" mainContainer centered tag="main" className="mb-600">
      <h1 className='mb-400'>Admin</h1>
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
              <GcdsLink href="#chat-logs">Chat Logs</GcdsLink>
            </GcdsText>
          </li>
          <li className="mb-400">
            <GcdsText>
              <GcdsLink href={`/${lang}/logs`}>Full Logs View</GcdsLink>
            </GcdsText>
          </li>
          <li className="mb-400">
            <GcdsText>
              <GcdsLink href={`/${lang}`}>Use the app</GcdsLink>
            </GcdsText>
          </li>
        </ul>
      </nav>

      <section id="debug-logs" className="mb-600">
        <h2 className='mt-400 mb-400'>Debug Logs</h2>
        <DatabaseLogs />
      </section>

      <section id="chat-logs" className="mb-600">
        <h2 className='mt-400 mb-400'>Chat interaction logs</h2>
        <ChatLogsDashboard />
      </section>
    </GcdsContainer>
  );
};

export default AdminPage;