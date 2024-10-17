import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import '@cdssnc/gcds-components-react/gcds.css'
import '@cdssnc/gcds-utility/dist/gcds-utility.min.css';
import checkDatabaseConnection from './services/database';

const renderApp = () => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

if (process.env.REACT_APP_ENV === 'production') {
  checkDatabaseConnection()
    .then((isConnected) => {
      if (isConnected) {
        console.log('Database is connected');
      } else {
        console.warn('Database is not connected. Some features may not work.');
      }
      renderApp();
    })
    .catch((error) => {
      console.error('Error checking database connection:', error);
      renderApp();
    });
} else {
  console.log('Running in development mode. Skipping database connection check.');
  renderApp();
}

reportWebVitals();