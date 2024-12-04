import checkCitationUrl from './urlChecker';

/**
 * URLToSearch class provides methods to validate and verify URLs for Canada.ca domains
 * Valid canada.ca urls are checked for 404 and if not, returned with high confidence 
 * If not a valid canada.ca url, a search url is prepared based on department and returned with low confidence
 */
class URLToSearch {

  /**
   * Validate and check URL accessibility
   * @param {string} url - URL to validate and check
   * @param {string} lang - Language code ('en' or 'fr')
   * @param {string} question - User's question to append to search
   * @param {string} department - Department code (isc, cra, ircc, or undefined)
   * @param {function} t - Translation function
   * @returns {Promise<object>} Validation result with network check
   */
  async validateAndCheckUrl(url, lang, question, department, t) {
    // Function to check if a URL is a Canada.ca domain
    const isCanadaCaDomain = (url) => {
      return url.startsWith('https://www.canada.ca') || url.startsWith('http://www.canada.ca');
    };

    // Only check Canada.ca URLs to see if they are going to 404
    let checkResult = { isValid: true };
    if (isCanadaCaDomain(url)) {
      checkResult = await checkCitationUrl(url);
    }

    // Only return the URL with high confidence if both conditions are met: valid URL that isn't 404 and Canada.ca domain
    if (checkResult.isValid && isCanadaCaDomain(url)) {
      return {
        isValid: true,
        url: url,  // Keep the original URL
        confidenceRating: checkResult.confidenceRating
      };
    }

    // Prepare the search URL based on department
    const encodedQuestion = encodeURIComponent(question);
    let searchUrl;
    
    switch(department?.toLowerCase()) {
      case 'isc':
        searchUrl = `https://www.canada.ca/${lang}/indigenous-services-canada/search.html?q=${encodedQuestion}&wb-srch-sub=`;
        break;
      case 'cra':
        searchUrl = `https://www.canada.ca/${lang}/revenue-agency/search.html?q=${encodedQuestion}&wb-srch-sub=`;
        break;
      case 'ircc':
        searchUrl = `https://www.canada.ca/${lang}/services/immigration-citizenship/search.html?q=${encodedQuestion}&wb-srch-sub=`;
        break;
      default:
        searchUrl = `https://www.canada.ca/${lang}/sr/srb.html?q=${encodedQuestion}&wb-srch-sub=`;
    }

    return {
      isValid: false,
      fallbackUrl: searchUrl,
      fallbackText: t('homepage.chat.citation.fallbackText'),
      confidenceRating: '0.1'
    };
  }

};
  
// Export a singleton instance
export const urlToSearch = new URLToSearch();