/**
 * RedactionService.js
 * A service for redacting sensitive information from text content.
 * 
 * Redaction Types:
 * - Private Information (replaced with 'XXX')
 * - Profanity (replaced with '#' characters)
 * - Threats (replaced with '#' characters)
 * - Manipulation attempts (replaced with '#' characters)
 */

import profanityListEn from './redactions/badwords_en.txt';
import profanityListFr from './redactions/badwords_fr.txt';
import manipulationEn from './redactions/manipulation_en.json';
import manipulationFr from './redactions/manipulation_fr.json';

class RedactionService {
  constructor() {
    this.profanityPattern = null;
    this.manipulationPattern = null;
    this.isInitialized = false;
    this.initialize();
  }

  /**
   * Check if the service is ready to use
   * @returns {boolean} Whether the service is initialized
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Initialize the redaction patterns
   */
  async initialize() {
    try {
      await this.initializeProfanityPattern();
      this.initializeManipulationPattern();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize RedactionService:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Load and process profanity lists from both English and French sources
   * @returns {Promise<string[]>} Array of cleaned profanity words
   */
  async loadProfanityLists() {
    try {
      const [responseEn, responseFr] = await Promise.all([
        fetch(profanityListEn),
        fetch(profanityListFr)
      ]);
      
      const [textEn, textFr] = await Promise.all([
        responseEn.text(),
        responseFr.text()
      ]);
      
      const cleanFrenchWords = this.cleanFrenchProfanityList(textFr);
      const cleanEnglishWords = this.cleanEnglishProfanityList(textEn);
      
      const combinedWords = [...cleanEnglishWords, ...cleanFrenchWords];
      console.log('Loaded profanity words:', combinedWords.length, 'words');
      
      return combinedWords;
    } catch (error) {
      console.error('Error loading profanity lists:', error);
      return [];
    }
  }

  /**
   * Clean and process the French profanity list
   * @param {string} text Raw French profanity list
   * @returns {string[]} Cleaned French words
   */
  cleanFrenchProfanityList(text) {
    return text
      .split(',')
      .map(word => word
        .replace(/[!@,]/g, '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
      )
      .filter(word => word.length > 0);
  }

  /**
   * Clean and process the English profanity list
   * @param {string} text Raw English profanity list
   * @returns {string[]} Cleaned English words
   */
  cleanEnglishProfanityList(text) {
    return text
      .split(',')
      .map(word => word.trim())
      .filter(word => word.length > 0);
  }

  /**
   * Initialize the profanity pattern
   */
  async initializeProfanityPattern() {
    const words = await this.loadProfanityLists();
    const pattern = words.map(word => `\\b${word}\\b`).join('|');
    this.profanityPattern = new RegExp(`(${pattern})`, 'gi');
  }

  /**
   * Initialize the manipulation pattern
   */
  initializeManipulationPattern() {
    const manipulationWords = [
      ...manipulationEn.suspiciousWords,
      ...manipulationEn.manipulationPhrases,
      ...manipulationFr.suspiciousWords,
      ...manipulationFr.manipulationPhrases
    ];

    const pattern = manipulationWords
      .map(word => {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return `\\b${escaped}\\b`;
      })
      .join('|');
    
    this.manipulationPattern = new RegExp(`(${pattern})`, 'gi');
  }

  /**
   * Get the list of private information patterns
   * @returns {RegExp[]} Array of regular expressions for private information
   */
  get privatePatterns() {
    return [
      {
        pattern: /(?<=\b(name\s+is|nom\s+est|name:|nom:)\s+)([A-Za-z]+(?:\s+[A-Za-z]+)?)\b/gi,
        description: 'Name patterns in EN/FR'
      },
      {
        pattern: /((\+\d{1,2}\s?)?1?[-.]?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}|(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?)/g,
        description: 'Phone numbers (including international formats and extensions)'
      },
      {
        pattern: /([a-zA-Z0-9_\-.]+)\s*@([\sa-zA-Z0-9_\-.]+)[.,]([a-zA-Z]{1,5})/g,
        description: 'Email addresses (with flexible spacing and punctuation)'
      },
      {
        pattern: /\d+\s+([A-Za-z]+\s+){1,3}(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Court|Ct|Lane|Ln|Way|Parkway|Pkwy|Square|Sq|Terrace|Ter|Place|Pl|circle|cir|Loop)\b/gi,
        description: 'Street addresses'
      },
      {
        pattern: /[A-Za-z]\s*\d\s*[A-Za-z]\s*[ -]?\s*\d\s*[A-Za-z]\s*\d/g,
        description: 'Canadian postal codes (with flexible spacing)'
      },
      {
        pattern: /\b\d{5}(?:-\d{4})?\b/g,
        description: 'US ZIP codes'
      },
      {
        pattern: /\b(apt|bldg|dept|fl|hngr|lot|pier|rm|ste|slip|trlr|unit|#)\.? *\d+[a-z]?\b/gi,
        description: 'Apartment addresses'
      },
      {
        pattern: /P\.? ?O\.? *Box +\d+/gi,
        description: 'PO Box'
      },
      {
        pattern: /(\d{1,3}(\.\d{1,3}){3}|[0-9A-F]{4}(:[0-9A-F]{4}){5}(::|(:0000)+))/gi,
        description: 'IP addresses'
      },
      {
        pattern: /(\d{3}\s*\d{3}\s*\d{3}|\d{3}\D*\d{3}\D*\d{3})/g,
        description: 'Social Insurance Numbers (with flexible separators)'
      },
      {
        pattern: /\b([A-Za-z]{2}\s*\d{6})\b/g,
        description: 'Passport Numbers'
      },
      {
        pattern: /([^\s:/?#]+):\/\/([^/?#\s]*)([^?#\s]*)(\?([^#\s]*))?(#([^\s]*))?/g,
        description: 'URLs'
      },
      {
        pattern: /(?<!\$)(?!\d{4}\b)\b\d{5,}\b/g,
        description: 'Long number sequences'
      }
    ].map(({ pattern }) => pattern);
  }

  /**
   * Get the list of threat patterns in English and French
   * @returns {RegExp} Regular expression for threats
   */
  get threatPattern() {
    const englishThreats = 'bomb|gun|knife|sword|kill|murder|suicide|maim|die|anthrax|attack|assassinate|bomb|bombs|bombing|bombed|execution|explosive|explosives|shoot|shoots|shooting|shot|hostage|murder|suicide|kill|killed|killing';
    const frenchThreats = 'anthrax|attaque|assassiner|bombe|bombarder|bombance|bombardera|bombarderons|bombarderont|bombes|bombardement|bombardé|exécution|explosif|explosifs|tirer|tirerai|tirera|tirerons|tireront|tirons|fusillade|tiré|otage|meurtre|suicider|tuer|tuerai|tuera|tuerons|tueront|tuons|tué|tuerie';
    
    return new RegExp(`\\b(${englishThreats}|${frenchThreats})\\b`, 'gi');
  }

  /**
   * Get all redaction patterns
   * @returns {Array<{pattern: RegExp, type: string}>} Array of pattern objects
   */
  get redactionPatterns() {
    return [
      ...this.privatePatterns.map(pattern => ({ pattern, type: 'private' })),
      { 
        pattern: this.profanityPattern,
        type: 'profanity'
      },
      { 
        pattern: this.threatPattern,
        type: 'threat'
      },
      {
        pattern: this.manipulationPattern,
        type: 'manipulation'
      }
    ];
  }

  /**
   * Redact sensitive information from text
   * @param {string} text Text to redact
   * @returns {{redactedText: string, redactedItems: Array<{value: string, type: string}>}}
   * @throws {Error} If service is not initialized
   */
  redactText(text) {
    if (!this.isReady()) {
      throw new Error('RedactionService is not initialized');
    }

    if (!text) return { redactedText: '', redactedItems: [] };

    let redactedText = text;
    const redactedItems = [];

    // Filter out patterns with null RegExp (in case initialization failed)
    const validPatterns = this.redactionPatterns.filter(({ pattern }) => pattern !== null);

    validPatterns.forEach(({ pattern, type }, index) => {
      // Skip processing if this pattern type has already been redacted
      if ((type === 'profanity' || type === 'threat' || type === 'manipulation') && 
          redactedText.includes('XXX')) {
        return;
      }

      redactedText = redactedText.replace(pattern, (match) => {
        console.log(`Pattern ${index} matched: "${match}"`);
        redactedItems.push({ value: match, type });
        return type === 'private' ? 'XXX' : '#'.repeat(match.length);
      });
    });

    return { redactedText, redactedItems };
  }
}

// Create and export a singleton instance
const redactionService = new RedactionService();
export default redactionService;
