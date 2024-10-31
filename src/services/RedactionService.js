// RedactionService.js

import profanityListEn from './redactions/badwords_en.txt';
import profanityListFr from './redactions/badwords_fr.txt';

async function loadProfanityLists() {
  try {
    const [responseEn, responseFr] = await Promise.all([
      fetch(profanityListEn),
      fetch(profanityListFr)
    ]);
    
    const textEn = await responseEn.text();
    const textFr = await responseFr.text();
    
    // Clean up the French text
    const cleanFrenchText = textFr
      .split('\n')
      .map(word => word
        .replace(/[!@,]/g, '') // Remove !, @, and commas
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .trim()
      )
      .filter(word => word.length > 0); // Remove empty entries
    
    // Clean English list similarly for consistency
    const cleanEnglishText = textEn
      .split('\n')
      .map(word => word.trim())
      .filter(word => word.length > 0);
    
    // Combine both lists
    const words = [...cleanEnglishText, ...cleanFrenchText];
    
    console.log('Loaded profanity words:', words); // For debugging
    
    return words;
  } catch (error) {
    console.error('Error loading profanity lists:', error);
    return [];
  }
}

// Create the pattern once both lists are loaded
let profanityPattern = null;
loadProfanityLists().then(words => {
  const pattern = words.join('|');
  profanityPattern = new RegExp(`(${pattern})`, 'gi');
});

const redactionPatterns = [
  { pattern: /\b(?!(?:1[89]|20)\d{2}\b)(?:\d{3,4}[-.\s]?){2,}\d{3,4}\b/g }, // Numbers (including phone, SIN, account numbers with separators), but not 4-digit years
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g }, // Email addresses
  { pattern: /\d+\s+([A-Za-z]+\s+){1,3}(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Court|Ct|Lane|Ln|Way|Parkway|Pkwy|Square|Sq|Terrace|Ter|Place|Pl|circle|cir|Loop)\b/gi }, // Addresses
  { pattern: /\b[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d\b/gi }, // Canadian postal codes
  { pattern: /\b\d{5}(?:-\d{4})?\b/g }, // US ZIP codes
  { pattern: /\b(apt|bldg|dept|fl|hngr|lot|pier|rm|ste|slip|trlr|unit|#)\.? *\d+[a-z]?\b/gi }, //apartment address
  { pattern: /P\.? ?O\.? *Box +\d+/gi }, //po box
  { pattern: /(\d{1,3}(\.\d{1,3}){3}|[0-9A-F]{4}(:[0-9A-F]{4}){5}(::|(:0000)+))/gi }, // ipAddress
  { pattern: /\b\d{3}[ -.]\d{2}[ -.]\d{4}\b/g }, //usSocialSecurityNumber
  // { pattern: /(user( ?name)?|login): \S+/gi }, //username - leave this in as there are many questions that mention these words
  { pattern: /([^\s:/?#]+):\/\/([^/?#\s]*)([^?#\s]*)(\?([^#\s]*))?(#([^\s]*))?/g }, //url
  { pattern: /(?<!\$)\b\d{5,}\b/g }, // Sequences of 5 or more digits not preceded by $
  { 
    get pattern() { return profanityPattern; },
    type: 'profanity'
  },
  { 
    pattern: /(bomb|gun|knife|sword|kill|murder|suicide|maim|die|anthrax|attack|assassinate|bomb|bombs|bombing|bombed|execution|explosive|explosives|shoot|shoots|shooting|shot|hostage|murder|suicide|kill|killed|killing)/gi,
    type: 'threat'
  },
  {
    pattern: /(anthrax|attaque|assassiner|bombe|bombarder|bombance|bombardera|bombarderons|bombarderont|bombes|bombardement|bombardé|exécution|explosif|explosifs|tirer|tirerai|tirera|tirerons|tireront|tirons|fusillade|tiré|otage|meurtre|suicider|tuer|tuerai|tuera|tuerons|tueront|tuons|tué|tuerie)/gi,
    type: 'threat'
  }
];

const redactText = (text) => {
  let redactedText = text;
  let redactedItems = [];

  console.log("Original text:", text);

  redactionPatterns.forEach(({ pattern, type }, index) => {
    const tempText = redactedText;
    redactedText = redactedText.replace(pattern, (match) => {
      console.log(`Pattern ${index} matched: "${match}"`);
      redactedItems.push({ value: match, type });
      return (type === 'profanity' || type === 'threat') ? '#'.repeat(match.length) : 'XXX';
    });

    if (tempText !== redactedText) {
      console.log(`Text after applying pattern ${index}:`, redactedText);
    }
  });

  console.log("Final redacted text:", redactedText);
  console.log("Redacted items:", redactedItems);

  return { redactedText, redactedItems };
};

const RedactionService = {
  redactText
};

export default RedactionService;
