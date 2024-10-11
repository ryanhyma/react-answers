const checkCitationUrl = async (url) => {
    if (!url) return null;
  
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.status === 404) {
        return {
          isValid: false,
          fallbackUrl: 'https://www.canada.ca/en/sr/srb/sra.html',
          fallbackText: 'Unable to find a citation - use canada.ca search'
        };
      }
      return { isValid: true, url };
    } catch (error) {
      console.error('Error checking citation URL:', error);
      return {
        isValid: false,
        fallbackUrl: 'https://www.canada.ca/en/sr/srb/sra.html',
        fallbackText: 'Unable to find a citation - use canada.ca search'
      };
    }
  };
  
  export default checkCitationUrl;