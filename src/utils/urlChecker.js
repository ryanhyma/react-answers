const checkCitationUrl = async (url) => {
  if (!url) return null;

  // Function to check if a URL is a Canada.ca domain
  const isCanadaCaDomain = (url) => {
    return url.startsWith('https://www.canada.ca') || url.startsWith('http://www.canada.ca');
  };

  // If not a Canada.ca domain, return early with basic validation
  if (!isCanadaCaDomain(url)) {
    return { 
      isValid: true, 
      url: url,
      confidenceRating: 0.25
    };
  }

  // Define the fallback result object
  // TODO: Update this to use the correct search page for the language
  const fallbackResult = {
    isValid: false,
    fallbackUrl: 'https://www.canada.ca/en/sr/srb.html',
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
    });

    // Check if the final URL (after potential redirects) is a known 404 page
    if (notFoundPages.some(notFoundUrl => response.url.includes(notFoundUrl))) {
      return fallbackResult;
    }

    // Check for 404 status
    if (response.status === 404) {
      return fallbackResult;
    }

    return { 
      isValid: true, 
      url: response.url,
      confidenceRating: 1
    };
  } catch (error) {
    console.error('Error checking Canada.ca URL:', error);
    return { 
      isValid: true, 
      url: url,
      confidenceRating: 0.5
    };
  }
};

export default checkCitationUrl;
