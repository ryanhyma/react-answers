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
      mode: 'cors',
      credentials: 'omit',
      redirect: 'follow'
    });

    // Check if the final URL (after potential redirects) is a known 404 page
    if (notFoundPages.includes(response.url)) {
      return fallbackResult;
    }

    // Check for 404 status
    if (response.status === 404) {
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
      // For CORS errors, we'll make a second attempt with no-cors mode
      try {
        const noCorsResponse = await fetch(url, { 
          method: 'GET',
          mode: 'no-cors',
          redirect: 'follow'
        });
        
        // If we get here, the URL exists but we can't check its exact status
        return {
          isValid: true,
          url: url,
          confidenceRating: 0.7 // Lower confidence due to CORS restrictions
        };
      } catch (noCorsError) {
        // If even no-cors fails, we'll assume the URL is invalid
        console.error('Error in no-cors fetch:', noCorsError);
        return fallbackResult;
      }
    }

    // For other types of errors, return the fallback result
    return fallbackResult;
  }
};

export default checkCitationUrl;