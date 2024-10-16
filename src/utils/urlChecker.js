const checkCitationUrl = async (url) => {
  // If no URL is provided, return null
  if (!url) return null;

  // Function to check if URL is a canada.ca domain
  const isCanadaCa = (url) => {
    return url.includes('canada.ca');
  };

  try {
    const response = await fetch(url, { 
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // If we reach here, the URL is valid
    return { 
      isValid: true, 
      url: url,  // Always return the original URL
      confidenceRating: isCanadaCa(url) ? 1 : 0.5 // Higher confidence for canada.ca URLs
    };
  } catch (error) {
    console.error('Error checking citation URL:', error);

    // Check if the error is a 404 (Not Found) error
    if (error.message.includes('404')) {
      return {
        isValid: false,
        url: url,  // Always return the original URL
        confidenceRating: 0
      };
    }

    // For CORS errors or other network issues
    return {
      isValid: true,  // Assume it's valid if we can't check
      url: url,  // Always return the original URL
      confidenceRating: isCanadaCa(url) ? 0.5 : 0.25  // Lower confidence, but still higher for canada.ca URLs
    };
  }
};

export default checkCitationUrl;