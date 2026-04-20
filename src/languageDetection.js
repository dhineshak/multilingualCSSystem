const franc = require('franc');

// Language patterns for Indian regional languages
const languagePatterns = {
  hi: {
    name: 'Hindi',
    patterns: [
      /[^\x00-\x7F]/, // Non-ASCII characters
      /[\u0900-\u097F]/, // Devanagari script range
      /\b(?:kya|hai|hai|mera|apka|kaise|kidhar|kyun|kab|ka|ki|ke)\b/i,
      /\b(?:namaste|pranam|dhanyawad|shukriya)\b/i
    ],
    keywords: ['kya', 'hai', 'mera', 'apka', 'namaste', 'dhanyawad']
  },
  ta: {
    name: 'Tamil',
    patterns: [
      /[^\x00-\x7F]/,
      /[\u0B80-\u0BFF]/, // Tamil script range
      /\b(?:enna|epdi|engaluku|ungaluku|yaar|yaen|epadi|eppadi)\b/i,
      /\b(?:vanakkam|nandri)\b/i
    ],
    keywords: ['enna', 'epdi', 'vanakkam', 'nandri']
  },
  te: {
    name: 'Telugu',
    patterns: [
      /[^\x00-\x7F]/,
      /[\u0C00-\u0C7F]/, // Telugu script range
      /\b(?:emi|ela|naaku|meeku|evaru|enduku|ela|eppudu)\b/i,
      /\b(?:namaskaram|dhanyavadamulu)\b/i
    ],
    keywords: ['emi', 'ela', 'namaskaram', 'dhanyavadamulu']
  },
  kn: {
    name: 'Kannada',
    patterns: [
      /[^\x00-\x7F]/,
      /[\u0C80-\u0CFF]/, // Kannada script range
      /\b(?:enu|hege|nanage|ninage|yaaru,yenake,hege,eva)\b/i,
      /\b(?:namaskara,dhanyavadagalu)\b/i
    ],
    keywords: ['enu', 'hege', 'namaskara', 'dhanyavadagalu']
  }
};

function detectLanguage(text) {
  if (!text || typeof text !== 'string') {
    return 'en';
  }

  text = text.toLowerCase().trim();
  
  // Check for specific language patterns
  for (const [langCode, langData] of Object.entries(languagePatterns)) {
    let score = 0;
    
    // Check for script patterns
    for (const pattern of langData.patterns) {
      if (pattern.test(text)) {
        score += 2;
      }
    }
    
    // Check for keywords
    for (const keyword of langData.keywords) {
      if (text.includes(keyword)) {
        score += 3;
      }
    }
    
    if (score >= 3) {
      return langCode;
    }
  }
  
  // Fallback to franc library
  try {
    const detected = franc(text);
    const langMap = {
      'hin': 'hi',
      'tam': 'ta',
      'tel': 'te',
      'kan': 'kn',
      'eng': 'en'
    };
    
    return langMap[detected] || 'en';
  } catch (error) {
    console.warn('Language detection failed, defaulting to English');
    return 'en';
  }
}

module.exports = { detectLanguage, languagePatterns };
