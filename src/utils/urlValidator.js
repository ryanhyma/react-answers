import { menuStructure_EN } from '../services/systemPrompt/menuStructure_EN';
import { menuStructure_FR } from '../services/systemPrompt/menuStructure_FR';
import checkCitationUrl from './urlChecker';

/**
 * URLValidator class provides methods to validate and verify URLs for Canada.ca domains
 * It uses a cached set of known good URLs from the menu structure and performs
 * both static validation and network checks
 */
class URLValidator {
  constructor() {
    // Cache of valid URLs from the menu structure
    this.menuUrls = new Set();
  }

  /**
   * Initialize cache with URLs from menu structure for given language
   * This builds a Set of all known good URLs from the menu structure
   * @param {string} lang - Language code ('en' or 'fr')
   */
  initializeMenuUrls(lang = 'en') {
    // Clear existing cache
    this.menuUrls.clear();
    // Select menu structure based on language
    const menuStructure = lang.toLowerCase() === 'fr' ? menuStructure_FR : menuStructure_EN;

    // Helper function to process each section of the menu
    const processMenuSection = (section) => {
      // Add main section URL if it exists
      if (section.url) {
        this.menuUrls.add(section.url);
      }
      // Add URLs from submenus
      if (section.submenus) {
        Object.values(section.submenus).forEach(url => {
          if (typeof url === 'string') {
            this.menuUrls.add(url);
          }
        });
      }
      // Add URLs from most requested links
      if (section.mostRequested) {
        Object.values(section.mostRequested).forEach(url => {
          if (typeof url === 'string') {
            this.menuUrls.add(url);
          }
        });
      }
    };

    // Process all sections in the menu structure
    Object.values(menuStructure).forEach(processMenuSection);
  }

  /**
   * Validate if a URL appears to be a legitimate Canada.ca or gc.ca URL
   * Performs static validation without making network requests
   * @param {string} url - URL to validate
   * @param {string} lang - Language code ('en' or 'fr')
   * @returns {object} Validation result with isValid and confidence score
   */
  validateUrl(url, lang = 'en') {
    // Initialize/refresh URL cache if needed
    if (this.menuUrls.size === 0) {
      this.initializeMenuUrls(lang);
    }

    // If URL exists in our menu structure, it's definitely valid
    if (this.menuUrls.has(url)) {
      return { isValid: true, confidence: 1.0 };
    }

    // Basic check for canada.ca or gc.ca domains without being too restrictive
    const validDomains = ['.canada.ca', '.gc.ca'];
    const hasValidDomain = validDomains.some(domain => 
      url.toLowerCase().includes(domain) && url.startsWith('http')
    );

    if (!hasValidDomain) {
      return { isValid: false, confidence: 0 };
    }

    // Patterns that might indicate a hallucinated or invalid URL
    const suspiciousPatterns = [
      /\/temp\//,   // Temporary directories
      /\/test\//,   // Test directories
      /\s/,         // URLs shouldn't contain spaces
      /[^a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]/  // Invalid URL characters
    ];

    // Check for suspicious patterns
    if (suspiciousPatterns.some(pattern => pattern.test(url))) {
      return { isValid: false, confidence: 0 };
    }

    // Start with base confidence for valid domain
    let confidence = 0.7;

    // Boost confidence if URL follows patterns we see in our menu structure
    // For example, if it matches the language pattern of known good URLs
    if (url.includes(`/${lang}/`)) {
      confidence = Math.min(confidence + 0.1, 0.95);
    }

    return { isValid: true, confidence };
  }

  /**
   * Validate and check URL accessibility
   * @param {string} url - URL to validate and check
   * @param {string} lang - Language code ('en' or 'fr')
   * @param {function} t - Translation function
   * @returns {Promise<object>} Validation result with network check
   */
  async validateAndCheckUrl(url, lang, t) {
    // First do the static validation
    const validationResult = this.validateUrl(url, lang);
    
    // If confidence is high (URL exists in menu), skip network check
    if (validationResult.confidence >= 0.95) {
      return {
        isValid: true,
        url: url,
        confidenceRating: '1.0'
      };
    }

    // For all other URLs, perform network validation
    const checkResult = await checkCitationUrl(url);
    
    // If URL is invalid (either from structural validation or network check)
    if (!validationResult.isValid || !checkResult.isValid) {
      // Try to get a relevant fallback URL using the full invalid URL
      const fallback = this.getFallbackUrl(url, lang);

      return {
        isValid: false,
        fallbackUrl: fallback.confidence > 0.3 
          ? fallback.url 
          : `https://www.canada.ca/${lang}/sr/srb.html`,
        fallbackText: t('homepage.chat.citation.fallbackText'),
        confidenceRating: fallback.confidence.toFixed(1)  // Format to one decimal place
      };
    }

    return {
      isValid: true,
      url: checkResult.url,
      confidenceRating: '0.8'
    };
  }

  /**
   * Get a fallback URL from the menu structure based on topic if it's 404 
   */
  getFallbackUrl(url, lang = 'en') {
    const menuStructure = lang === 'fr' ? menuStructure_FR : menuStructure_EN;
    let bestMatch = { url: '', confidence: 0 };

    // Parse the 404 URL into meaningful segments
    const urlObj = new URL(url);
    const urlSegments = urlObj.pathname
        .split('/')
        .filter(segment => 
            segment && 
            !['en', 'fr', 'www', 'canada', 'ca'].includes(segment)
        );
    
    console.log('404 URL segments:', urlSegments);

    // Helper function to compare URL paths
    const compareUrls = (menuUrl) => {
        try {
            const menuUrlObj = new URL(menuUrl);
            const menuSegments = menuUrlObj.pathname
                .split('/')
                .filter(segment => 
                    segment && 
                    !['en', 'fr', 'www', 'canada', 'ca'].includes(segment)
                );
            
            // console.log('Comparing with menu segments:', menuSegments);

            // Count matching segments
            let matchingSegments = 0;
            let partialMatches = 0;

            urlSegments.forEach(segment => {
                if (menuSegments.includes(segment)) {
                    matchingSegments++;
                    // console.log(`Exact segment match: ${segment}`);
                } else {
                    // Check for partial matches within segments
                    for (const menuSegment of menuSegments) {
                        if (menuSegment.includes(segment) || segment.includes(menuSegment)) {
                            partialMatches++;
                            // console.log(`Partial segment match: ${segment} ≈ ${menuSegment}`);
                            break;
                        }
                    }
                }
            });

            // Calculate confidence based on matches
            const confidence = (matchingSegments + (partialMatches * 0.5)) / 
                Math.max(urlSegments.length, menuSegments.length);
            
            // console.log(`Confidence for ${menuUrl}: ${confidence}`);
            return confidence;
        } catch (e) {
            // console.log(`Invalid URL in menu: ${menuUrl}`);
            return 0;
        }
    };

    // Search through menu structure
    Object.entries(menuStructure).forEach(([category, data]) => {
        // Check main category URL
        const mainUrlConfidence = compareUrls(data.url);
        if (mainUrlConfidence > bestMatch.confidence) {
            // console.log(`New best match (category): ${category} - ${data.url}`);
            bestMatch = { url: data.url, confidence: mainUrlConfidence };
        }

        // Check most requested
        if (data.mostRequested) {
            Object.entries(data.mostRequested).forEach(([item, itemUrl]) => {
                if (typeof itemUrl === 'string') {
                    const itemConfidence = compareUrls(itemUrl);
                    if (itemConfidence > bestMatch.confidence) {
                        // console.log(`New best match (most requested): ${item} - ${itemUrl}`);
                        bestMatch = { url: itemUrl, confidence: itemConfidence };
                    }
                }
            });
        }

        // Check topics
        if (data.topics) {
            Object.entries(data.topics).forEach(([topic, topicUrl]) => {
                if (typeof topicUrl === 'string') {
                    const topicConfidence = compareUrls(topicUrl);
                    if (topicConfidence > bestMatch.confidence) {
                        // console.log(`New best match (topic): ${topic} - ${topicUrl}`);
                        bestMatch = { url: topicUrl, confidence: topicConfidence };
                    }
                }
            });
        }
    });

    // console.log('Final best match:', bestMatch);
    return bestMatch;
  }
}

// Export a singleton instance
export const urlValidator = new URLValidator(); 