// RedactionService.js
// this is a temporary redaction service - redaction must happen at the front end and the user must see the redacted version

const redactionPatterns = [
  { type: 'phone', pattern: /\b(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g },
  { type: 'account', pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g },
  { type: 'email', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g },
  { type: 'address', pattern: /\d+\s+([A-Za-z]+\s+){1,3}(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Court|Ct|Lane|Ln|Way|Parkway|Pkwy|Square|Sq|Terrace|Ter|Place|Pl)\b/gi },
  { type: 'postal', pattern: /\b[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d\b/gi },
  { type: 'zip', pattern: /\b\d{5}(?:-\d{4})?\b/g },
];

const redactText = (text) => {
  let redactedText = text;
  let redactedItems = [];

  redactionPatterns.forEach(({ type, pattern }) => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        redactedText = redactedText.replace(match, `[REDACTED ${type.toUpperCase()}]`);
        redactedItems.push({ type, value: match });
      });
    }
  });

  return { redactedText, redactedItems };
};

const RedactionService = {
  redactText
};

export default RedactionService;