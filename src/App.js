/* eslint-disable no-unused-vars */
/* eslint-disable import/no-unused-modules */
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import { GcdsHeader, GcdsBreadcrumbs, GcdsBreadcrumbsItem, GcdsFooter } from '@cdssnc/gcds-components-react';
import './styles/App.css';

// Helper function to get alternate language path
const getAlternatePath = (currentPath, currentLang) => {
  const newLang = currentLang === 'en' ? 'fr' : 'en';
  if (currentPath === '/' || currentPath === '/fr') {
    return `/${newLang}`;
  }
  // Remove leading language identifier if it exists and add new one
  const pathWithoutLang = currentPath.replace(/^\/(en|fr)/, '');
  return `/${newLang}${pathWithoutLang}`;
};

const AppContent = () => {
  const location = useLocation();
  const currentLang = location.pathname.startsWith('/fr') ? 'fr' : 'en';
  const alternateLangHref = getAlternatePath(location.pathname, currentLang);

  return (
    <>
      <section className="alpha-top">
        <div className="container">
          <small>
            <span className="alpha-label">Alpha</span>&nbsp;&nbsp; 
            {currentLang === 'en' ? 'Experimental page - not public.' : 'Page expérimentale - non publique.'}
          </small>
        </div>
      </section>
      
      <GcdsHeader 
        lang={currentLang}
        langHref={alternateLangHref}
        skipToHref="#main-content"
      >
        <GcdsBreadcrumbs slot="breadcrumb">
          {/* Add breadcrumb items as needed */}
        </GcdsBreadcrumbs>
      </GcdsHeader>

      <main id="main-content">
        <Routes>
          {/* English routes */}
          <Route path="/" element={<HomePage lang="en" />} />
          <Route path="/en" element={<HomePage lang="en" />} />
          <Route path="/en/admin" element={<AdminPage lang="en" />} />
          
          {/* French routes */}
          <Route path="/fr" element={<HomePage lang="fr" />} />
          <Route path="/fr/admin" element={<AdminPage lang="fr" />} />
        </Routes>
      </main>

      <GcdsFooter 
        display='compact'
        lang={currentLang}
      />
    </>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;