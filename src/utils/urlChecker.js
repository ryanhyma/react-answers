const checkCitationUrl = async (url) => {
  // If no URL is provided, return null
  if (!url) return null;

  // Define the fallback result object
  const fallbackResult = {
    isValid: false,
    fallbackUrl: 'https://www.canada.ca/en/sr/srb/sra.html',
    fallbackText: 'Unable to find a citation - use canada.ca search',
    confidenceRating: 0
  };

  // Define known 404 pages
  const notFoundPages = [
    'https://www.canada.ca/errors/404.html',
    'https://www.canada.ca/fr/erreurs/404.html'
  ];

  try {
    const response = await fetch(url, { 
      method: 'GET',
      mode: 'cors', // Explicitly set mode to 'cors'
      credentials: 'omit', // Omit credentials to avoid CORS preflight
      redirect: 'follow'
    });

    // Check if the final URL (after potential redirects) is a known 404 page
    if (notFoundPages.includes(response.url)) {
      return fallbackResult;
    }

    // If we've reached here, the URL is valid
    return { 
      isValid: true, 
      url: response.url,
      confidenceRating: 1
    };
  } catch (error) {
    console.error('Error checking citation URL:', error);

    // Check if the error is due to CORS
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      // Assume the URL is valid if we get a CORS error (we received a response, just can't read it)
      return {
        isValid: true,
        url: url,
        confidenceRating: 0.7 // Lower confidence due to CORS error
      };
    }

    // For other types of errors, return the fallback result
    return fallbackResult;
  }
};

export default checkCitationUrl;