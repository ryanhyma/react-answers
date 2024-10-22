// src/pages/AdminPage.js
import React from 'react';
import FeedbackEvaluator from '../components/admin/FeedbackEvaluator';
import { GcdsContainer } from '@cdssnc/gcds-components-react';

const AdminPage = () => {
  // Check if user is authenticated (you'll implement this later)
  const isAuthenticated = true; // Temporary, will need proper auth later

  if (!isAuthenticated) {
    return (
      <GcdsContainer>
        <h1>Access Denied</h1>
        <p>You must be authenticated to view this page.</p>
      </GcdsContainer>
    );
  }

  return (
    <GcdsContainer size="xl" mainContainer centered tag="main" className="mb-600">
      <h1>Admin evaluations</h1>
      <FeedbackEvaluator />
    </GcdsContainer>
  );
};

export default AdminPage;