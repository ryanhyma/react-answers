const checkCitationUrl = async (url) => {
  if (!url) return null;

  const fallbackResult = {
    isValid: false,
    fallbackUrl: 'https://www.canada.ca/en/sr/srb/sra.html',
    fallbackText: 'Unable to find a citation - use canada.ca search',
    confidenceRating: 0
  };

  const notFoundPages = [
    'https://www.canada.ca/errors/404.html',
    'https://www.canada.ca/fr/erreurs/404.html'
  ];

  try {
    const response = await fetch(url, { 
      method: 'GET',
      redirect: 'follow'
    });

    if (notFoundPages.includes(response.url)) {
      return fallbackResult;
    }

    if (!response.ok || response.status === 404) {
      return fallbackResult;
    }

    return { 
      isValid: true, 
      url: response.url,
      confidenceRating: 1  // We'll keep the original confidence rating for valid URLs
    };
  } catch (error) {
    console.error('Error checking citation URL:', error);
    return fallbackResult;
  }
};

export default checkCitationUrl;
