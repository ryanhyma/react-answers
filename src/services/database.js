const checkDatabaseConnection = async () => {
  if (process.env.REACT_APP_ENV !== 'production') {
    console.log('Skipping database connection check in development environment');
    return true;
  }

  try {
    const response = await fetch('/api/db-check');
    if (!response.ok) {
      throw new Error('Database connection failed');
    }
    const data = await response.json();
    console.log('Database connection status:', data.message);
    return true;
  } catch (error) {
    console.error('Error checking database connection:', error);
    return false;
  }
};

export default checkDatabaseConnection;
