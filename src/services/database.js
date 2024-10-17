const checkDatabaseConnection = async () => {
    try {
      const response = await fetch('/api/check-db');
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