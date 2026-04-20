const axios = require('axios');

// Mock translation data for demo purposes
const mockTranslations = {
  // Hindi translations
  hi: {
    'hello': 'namaste',
    'how can i help you': 'main aapki kya madad kar sakta hun',
    'what is your name': 'aapka naam kya hai',
    'thank you': 'dhanyawad',
    'goodbye': 'alvida',
    'your kyc status is pending': 'aapka kyc status pending hai',
    'your transaction was successful': 'aapka transaction successful hai',
    'your account balance is': 'aapka account balance hai'
  },
  // Tamil translations
  ta: {
    'hello': 'vanakkam',
    'how can i help you': 'naan ungalukku eppadi help seivathu',
    'what is your name': 'ungal peyar enna',
    'thank you': 'nandri',
    'goodbye': 'poitu varengal',
    'your kyc status is pending': 'ungal kyc status pending irukku',
    'your transaction was successful': 'ungal transaction successful aagirukku',
    'your account balance is': 'ungal account balance irukku'
  },
  // Telugu translations
  te: {
    'hello': 'namaskaram',
    'how can i help you': 'nenu mi help ela cheyagalanu',
    'what is your name': 'mi peru emi',
    'thank you': 'dhanyavadamulu',
    'goodbye': 'vellandi',
    'your kyc status is pending': 'mi kyc status pending undi',
    'your transaction was successful': 'mi transaction successful ayindi',
    'your account balance is': 'mi account balance undi'
  },
  // Kannada translations
  kn: {
    'hello': 'namaskara',
    'how can i help you': 'naanu nimagu hege help madabahudu',
    'what is your name': 'nimma hesaru enu',
    'thank you': 'dhanyavadagalu',
    'goodbye': 'hogi bartini',
    'your kyc status is pending': 'nimma kyc status pending ide',
    'your transaction was successful': 'nimma transaction successful agide',
    'your account balance is': 'nimma account balance ide'
  }
};

async function translateText(text, fromLang, toLang) {
  // If same language, return as-is
  if (fromLang === toLang) {
    return text;
  }
  
  // For demo mode, use mock translations
  if (process.env.DEMO_MODE === 'true') {
    return mockTranslate(text, fromLang, toLang);
  }
  
  // For production, you would use Google Translate API here
  try {
    // Example with Google Translate API (requires API key)
    if (process.env.GOOGLE_TRANSLATE_API_KEY) {
      const response = await axios.post(
        `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
        {
          q: text,
          source: fromLang,
          target: toLang,
          format: 'text'
        }
      );
      
      return response.data.data.translations[0].translatedText;
    }
    
    // Fallback to mock translation
    return mockTranslate(text, fromLang, toLang);
    
  } catch (error) {
    console.error('Translation error:', error);
    return mockTranslate(text, fromLang, toLang);
  }
}

function mockTranslate(text, fromLang, toLang) {
  // Simple mock translation for demo
  const lowerText = text.toLowerCase();
  
  if (fromLang === 'en' && mockTranslations[toLang]) {
    // Check for exact matches
    if (mockTranslations[toLang][lowerText]) {
      return mockTranslations[toLang][lowerText];
    }
    
    // Simple word-by-word replacement for demo
    let translated = text;
    for (const [english, translatedWord] of Object.entries(mockTranslations[toLang])) {
      translated = translated.replace(new RegExp(english, 'gi'), translatedWord);
    }
    return translated;
  }
  
  if (toLang === 'en' && mockTranslations[fromLang]) {
    // Reverse translation
    const reverseMap = {};
    for (const [key, value] of Object.entries(mockTranslations[fromLang])) {
      reverseMap[value] = key;
    }
    
    if (reverseMap[lowerText]) {
      return reverseMap[lowerText];
    }
    
    // Simple word-by-word reverse replacement
    let translated = text;
    for (const [translatedWord, english] of Object.entries(reverseMap)) {
      translated = translated.replace(new RegExp(translatedWord, 'gi'), english);
    }
    return translated;
  }
  
  // If no translation available, return original text
  return text;
}

module.exports = { translateText, mockTranslations };
