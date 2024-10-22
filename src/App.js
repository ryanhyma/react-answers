/* eslint-disable no-unused-vars */
/* eslint-disable import/no-unused-modules */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import { GcdsHeader, GcdsBreadcrumbs, GcdsBreadcrumbsItem, GcdsFooter } from '@cdssnc/gcds-components-react';
import './styles/App.css';

function App() {
  return (
    <Router>
      <section className="alpha-top">
        <div className="container">
          <small><span className="alpha-label">Alpha</span>&nbsp;&nbsp; Experimental page - not public.</small>
        </div>
      </section>
      
      <GcdsHeader langHref="#" skipToHref="#">
        <GcdsBreadcrumbs slot="breadcrumb">
        </GcdsBreadcrumbs>
      </GcdsHeader>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>

      <GcdsFooter display='full'></GcdsFooter>
    </Router>
  );
}

export default App;