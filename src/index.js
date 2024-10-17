import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import '@cdssnc/gcds-components-react/gcds.css'
import '@cdssnc/gcds-utility/dist/gcds-utility.min.css';
import checkDatabaseConnection from './services/database';

checkDatabaseConnection()
  .then((isConnected) => {
    if (isConnected) {
      console.log('Database is connected');
    } else {
      console.warn('Database is not connected. Some features may not work.');
    }
    // Render the React app regardless of database connection status
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  })
  .catch((error) => {
    console.error('Error checking database connection:', error);
    // Render the app even if there's an error checking the database connection
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });

reportWebVitals();