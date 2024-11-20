import { menuStructure_EN } from '../services/menuStructure_EN';
import { menuStructure_FR } from '../services/menuStructure_FR';
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
   * Get a fallback URL from the menu structure based on topic
   */
  getFallbackUrl(url, lang = 'en') {
    const menuStructure = lang === 'fr' ? menuStructure_FR : menuStructure_EN;
    let bestMatch = { url: '', confidence: 0 };

    // Extract meaningful parts from the invalid URL and clean them
    const urlParts = url.toLowerCase()
        .replace(/[.-]/g, ' ')  // Replace dots and hyphens with spaces
        .split('/')
        .filter(part => part.length > 3 && 
            !['www', 'canada', 'ca', 'fr', 'en', 'services', 'topics', 'about'].includes(part));
    
    // Join parts and add individual important words for better matching
    const searchTerms = [...urlParts, ...urlParts.join(' ').split(' ')]
        .filter((term, index, self) => self.indexOf(term) === index)  // Remove duplicates
        .join(' ');

    // Helper function to calculate string similarity with improved matching
    const calculateSimilarity = (str1, str2) => {
        const words1 = str1.toLowerCase().split(/[\s-]+/);
        const words2 = str2.toLowerCase().split(/[\s-]+/);
        
        // Count matching words
        const matches = words1.filter(word => 
            words2.some(w2 => w2.includes(word) || word.includes(w2))
        ).length;

        // Calculate similarity score
        return matches / Math.max(words1.length, words2.length);
    };

    // Search through menu structure with improved matching
    Object.entries(menuStructure).forEach(([category, data]) => {
        // Check main category URL - removed special tax handling
        const mainUrlSimilarity = calculateSimilarity(searchTerms, category);
        if (mainUrlSimilarity > bestMatch.confidence) {
            bestMatch = { url: data.url, confidence: mainUrlSimilarity };
        }

        // Check most requested items
        if (data.mostRequested) {
            Object.entries(data.mostRequested).forEach(([item, itemUrl]) => {
                // Only process if itemUrl is a valid string
                if (typeof itemUrl === 'string') {
                    const itemSimilarity = calculateSimilarity(searchTerms, item);
                    if (itemSimilarity > bestMatch.confidence) {
                        bestMatch = { url: itemUrl, confidence: itemSimilarity };
                    }
                }
            });
        }
    });

    return bestMatch;
  }
}

// Export a singleton instance
export const urlValidator = new URLValidator(); 