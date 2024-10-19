const checkCitationUrl = async (url) => {
  // If no URL is provided, return null
  if (!url) return null;

  console.log('Checking citation URL:', url);

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

  // Function to check if a URL is a Canada.ca domain
  const isCanadaCaDomain = (url) => {
    return url.startsWith('https://www.canada.ca') || url.startsWith('http://www.canada.ca');
  };

  try {
    const response = await fetch(url, { 
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
    });

    console.log('Response status:', response.status);
    console.log('Final URL after potential redirects:', response.url);

    // Only apply special handling for Canada.ca domains
    if (isCanadaCaDomain(url)) {
      // Check if the final URL (after potential redirects) is a known 404 page
      if (notFoundPages.some(notFoundUrl => response.url.includes(notFoundUrl))) {
        console.log('Canada.ca URL redirected to a known 404 page:', response.url);
        return fallbackResult;
      }

      // Check for 404 status
      if (response.status === 404) {
        console.log('Canada.ca URL returned a 404 status:', response.status);
        return fallbackResult;
      }
    }

    // For all other cases, return the URL as is
    return { 
      isValid: true, 
      url: response.url,  // This will be the final URL after any redirects
      confidenceRating: isCanadaCaDomain(response.url) ? 1 : 0.5 // Higher confidence for Canada.ca URLs
    };
  } catch (error) {
    console.error('Error checking citation URL:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      url: url
    });
    // For network errors or other issues, return the original URL
    return { 
      isValid: true, 
      url: url,
      confidenceRating: isCanadaCaDomain(url) ? 0.5 : 0.25 // Lower confidence, but still higher for Canada.ca URLs
    };
  }
};

export default checkCitationUrl;
