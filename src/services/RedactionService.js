// RedactionService.js

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
    pattern: /(fuck|shit|ass|damn|bitch|piss|dick|bastard|cunt|merde|putain|connard|salope|foutre|bordel|couille|chier)/gi,
    type: 'profanity'
  },
];

const redactText = (text) => {
  let redactedText = text;
  let redactedItems = [];

  console.log("Original text:", text);

  redactionPatterns.forEach(({ pattern, type }, index) => {
    const tempText = redactedText;
    redactedText = redactedText.replace(pattern, (match) => {
      console.log(`Pattern ${index} matched: "${match}"`);
      redactedItems.push({ value: match });
      return type === 'profanity' ? '#'.repeat(match.length) : 'XXX';
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
