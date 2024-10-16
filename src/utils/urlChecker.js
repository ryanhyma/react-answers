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
    // Attempt to fetch the URL
    const response = await fetch(url, { 
      method: 'GET',
      redirect: 'follow'  // This allows the fetch to follow redirects
    });

    // Check if the final URL (after potential redirects) is a known 404 page
    if (notFoundPages.includes(response.url)) {
      return fallbackResult;
    }

    // Check if the response is not OK (status outside 200-299 range) or specifically a 404
    if (!response.ok || response.status === 404) {
      return fallbackResult;
    }

    // If we've reached here, the URL is valid
    return { 
      isValid: true, 
      url: response.url,  // This will be the final URL after any redirects
      confidenceRating: 1  // We'll keep the original confidence rating for valid URLs
    };
  } catch (error) {
    // Log any errors that occur during the fetch process
    console.error('Error checking citation URL:', error);
    return fallbackResult;
  }
};

export default checkCitationUrl;
