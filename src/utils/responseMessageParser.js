export const parseContextMessage = (text) => {

  const topicMatch = test.match(/<topic>([\s\S]*?)<\/topic>/);
  const topicUrlMatch = test.match(/<topicUrl>([\s\S]*?)<\/topicUrl>/);
  const departmentMatch = text.match(/<department>([\s\S]*?)<\/department>/);
  const departmentUrlMatch = text.match(/<departmentUrl>([\s\S]*?)<\/departmentUrl>/);

  return {
    topic: topicMatch ? topicMatch[1] : null,
    topicUrl: topicUrlMatch ? topicUrlMatch[1] : null,
    department: departmentMatch ? departmentMatch[1] : null,
    departmentUrl: departmentUrlMatch ? departmentUrlMatch[1] : null
  };
};

export const parseMessageContent = (text) => {
  if (!text) {
    return { responseType: 'normal', content: '', preliminaryChecks: null, englishAnswer: null };
  }

  let responseType = 'normal';
  let content = text;
  let preliminaryChecks = null;
  let englishAnswer = null;
  let citationHead = null;
  let citationUrl = null;

  // Extract preliminary checks - this regex needs to capture multiline content
  const preliminaryMatch = /<preliminary-checks>([\s\S]*?)<\/preliminary-checks>/s.exec(text);
  if (preliminaryMatch) {
    preliminaryChecks = preliminaryMatch[1].trim();
    content = content.replace(/<preliminary-checks>[\s\S]*?<\/preliminary-checks>/s, '').trim();
  }

  // Extract citation information before processing answers
  const citationHeadMatch = /<citation-head>(.*?)<\/citation-head>/s.exec(content);
  const citationUrlMatch = /<citation-url>(.*?)<\/citation-url>/s.exec(content);

  if (citationHeadMatch) {
    citationHead = citationHeadMatch[1].trim();
  }
  if (citationUrlMatch) {
    citationUrl = citationUrlMatch[1].trim();
  }

  // Extract English answer first
  const englishMatch = /<english-answer>(.*?)<\/english-answer>/s.exec(content);
  if (englishMatch) {
    englishAnswer = englishMatch[1].trim();
    content = englishAnswer;  // Use English answer as content for English questions
  }

  // Extract main answer if it exists
  const answerMatch = /<answer>(.*?)<\/answer>/s.exec(text);
  if (answerMatch) {
    content = answerMatch[1].trim();
  }

  // Check response types
  if (content.includes('<not-gc>')) {
    responseType = 'not-gc';
    content = content.replace(/<\/?not-gc>/g, '').trim();
  } else if (content.includes('<pt-muni>')) {
    responseType = 'pt-muni';
    content = content.replace(/<\/?p?-?pt-muni>/g, '').trim();
  } else if (content.includes('<clarifying-question>')) {
    responseType = 'question';
    content = content.replace(/<\/?clarifying-question>/g, '').trim();
  }

  // Add citation information back to content if it exists
  if (citationHead) {
    content += `\n<citation-head>${citationHead}</citation-head>`;
  }
  if (citationUrl) {
    content += `\n<citation-url>${citationUrl}</citation-url>`;
  }

  return { responseType, content, preliminaryChecks, englishAnswer };
};


export const parseAnswerMessage = (aiService, text) => {
  const citationHeadRegex = /<citation-head>(.*?)<\/citation-head>/s;
  const citationUrlRegex = /<citation-url>(.*?)<\/citation-url>/s;
  const confidenceRatingRegex = /<confidence>(.*?)<\/confidence>/s;

  const headMatch = text.match(citationHeadRegex);
  const urlMatch = text.match(citationUrlRegex);
  const confidenceMatch = text.match(confidenceRatingRegex);

  let mainContent = text
    .replace(citationHeadRegex, '')
    .replace(citationUrlRegex, '')
    .replace(confidenceRatingRegex, '')
    .trim();

  const paragraphs = mainContent
    .split(/\n+/)
    .filter(para =>
      !para.includes('<citation-head>') &&
      !para.includes('<citation-url>') &&
      !para.includes('<confidence>')
    );

  const result = {
    paragraphs,
    citationHead: headMatch ? headMatch[1].trim() : null,
    citationUrl: urlMatch ? urlMatch[1].trim() : null,
    confidenceRating: confidenceMatch ? confidenceMatch[1] : null,
    aiService
  };

  return result;
};

export const parseAIResponse = (text,aiService) => {
  const citationHeadRegex = /<citation-head>(.*?)<\/citation-head>/s;
  const citationUrlRegex = /<citation-url>(.*?)<\/citation-url>/s;
  const confidenceRatingRegex = /<confidence>(.*?)<\/confidence>/s;

  const headMatch = text.match(citationHeadRegex);
  const urlMatch = text.match(citationUrlRegex);
  const confidenceMatch = text.match(confidenceRatingRegex);

  let mainContent = text
      .replace(citationHeadRegex, '')
      .replace(citationUrlRegex, '')
      .replace(confidenceRatingRegex, '')
      .trim();

  // Split content into paragraphs, but exclude any remaining citation tags
  const paragraphs = mainContent
      .split(/\n+/)
      .filter(para =>
          !para.includes('<citation-head>') &&
          !para.includes('<citation-url>') &&
          !para.includes('<confidence>')
      );

  const result = {
      paragraphs,
      citationHead: headMatch ? headMatch[1].trim() : null,
      citationUrl: urlMatch ? urlMatch[1].trim() : null,
      confidenceRating: confidenceMatch ? confidenceMatch[1] : null,
      aiService
  };

  return result;
};

