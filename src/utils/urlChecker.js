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
    // First, try a regular fetch to check for known 404 pages
    const regularResponse = await fetch(url, { 
      method: 'GET',
      redirect: 'follow'
    });

    // Check if the final URL (after potential redirects) is a known 404 page
    if (notFoundPages.includes(regularResponse.url)) {
      return fallbackResult;
    }

    // If the regular fetch succeeded and it's not a known 404 page, we consider it valid
    if (regularResponse.ok) {
      return { 
        isValid: true, 
        url: regularResponse.url,
        confidenceRating: 1
      };
    }

    // If the regular fetch failed due to CORS, try again with no-cors mode
    const noCorsResponse = await fetch(url, { 
      method: 'GET',
      mode: 'no-cors',
      redirect: 'follow'
    });

    // In no-cors mode, we can't access response properties like 'ok' or 'status'
    // The mere fact that we got a response (even if opaque) suggests the URL is valid
    return { 
      isValid: true, 
      url: url,  // We can't access response.url in no-cors mode, so we use the original URL
      confidenceRating: 0.8  // Lower confidence as we can't verify the exact status
    };
  } catch (error) {
    // Log any errors that occur during the fetch process
    console.error('Error checking citation URL:', error);
    return fallbackResult;
  }
};

export default checkCitationUrl;