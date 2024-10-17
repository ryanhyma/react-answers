import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import '@cdssnc/gcds-components-react/gcds.css'
import '@cdssnc/gcds-utility/dist/gcds-utility.min.css';
import connectDB from './services/database';

// Connect to MongoDB
connectDB()
  .then(() => {
    console.log('Connected to MongoDB');
    // Render the React app only after successfully connecting to the database
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB', error);
    // Render the app even if database connection fails
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });

reportWebVitals();