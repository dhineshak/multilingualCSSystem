require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase, closeConnection } = require('./src/database');
const aiService = require('./src/aiService');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client')));

// Database connection state
let dbInitialized = false;

// Initialize database on server start
async function initializeServer() {
  try {
    await initializeDatabase();
    dbInitialized = true;
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

// Helper function to validate PAN format
function isValidPAN(pan) {
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(pan);
}

// Helper function to query investor by PAN
async function queryInvestorByPan(panNumber) {
  try {
    const pool = require('./src/database').getPool();
    const request = pool.request();
    request.input('pan', require('mssql').VarChar, panNumber.toUpperCase());
    
    const result = await request.query('SELECT * FROM investorbasicdetail WHERE pan = @pan');
    return result.recordset;
  } catch (error) {
    console.error('Error querying investor details:', error);
    throw error;
  }
}

// Helper function to check activation status
async function checkActivationStatus(panNumber) {
  try {
    const pool = require('./src/database').getPool();
    const request = pool.request();
    request.input('pan', require('mssql').VarChar, panNumber.toUpperCase());
    
    // Check AllowTransact status
    const activationResult = await request.query('SELECT AllowTransact FROM InvestorBasicDetail WHERE pan = @pan');
    
    if (activationResult.recordset.length === 0) {
      return { status: 'not_found', allowTransact: null };
    }
    
    const allowTransact = activationResult.recordset[0].AllowTransact;
    
    if (allowTransact === 'A') {
      return { status: 'activated', allowTransact: allowTransact };
    } else {
      // Check ProfileReviewTime for non-activated users
      const reviewResult = await request.query(`
        SELECT r.ProfileReviewTime 
        FROM Restartability r 
        LEFT JOIN InvestorBasicDetail ibd ON ibd.UserID = r.userId 
        WHERE ibd.pan = @pan
      `);
      
      const profileReviewTime = reviewResult.recordset.length > 0 ? reviewResult.recordset[0].ProfileReviewTime : null;
      
      return { 
        status: 'not_activated', 
        allowTransact: allowTransact,
        profileReviewTime: profileReviewTime
      };
    }
  } catch (error) {
    console.error('Error checking activation status:', error);
    throw error;
  }
}

// Helper function to generate AI response
async function generateAIResponse(investorData, userQuery, language = 'en') {
  try {
    const intent = 'investor_details_query';
    
    // Check activation status
    const activationStatus = await checkActivationStatus(userQuery);
    
    // Format investor data for context
    let message = `User queried for PAN: ${userQuery}\n\n`;
    message += `Activation Status: ${activationStatus.status}\n`;
    message += `AllowTransact: ${activationStatus.allowTransact}\n`;
    
    if (activationStatus.profileReviewTime) {
      message += `ProfileReviewTime: ${activationStatus.profileReviewTime}\n`;
    }
    
    if (investorData && investorData.length > 0) {
      message += `Found ${investorData.length} record(s):\n`;
      investorData.forEach((record, index) => {
        message += `\nRecord ${index + 1}:\n`;
        Object.keys(record).forEach(key => {
          message += `${key}: ${record[key] || 'N/A'}\n`;
        });
      });
    } else {
      message += 'No records found for this PAN number.';
    }
    
    // Create language-specific context
    const context = {
      investorData: investorData,
      activationStatus: activationStatus,
      queryType: 'pan_based_lookup',
      englishMessage: message,
      language: language,
      userQuery: userQuery
    };
    
    // Generate language-specific response
    const aiResponse = await aiService.generateResponse(intent, message, language, context);
    
    // If AI fails, provide language-specific fallback
    if (!aiResponse || aiResponse.includes("I didn't quite understand")) {
      return generateLanguageSpecificFallback(investorData, userQuery, language, activationStatus);
    }
    
    return aiResponse;
  } catch (error) {
    console.error('Error generating AI response:', error);
    return generateLanguageSpecificFallback(investorData, userQuery, language, null);
  }
}

// Generate language-specific fallback responses
function generateLanguageSpecificFallback(investorData, userQuery, language, activationStatus) {
  const responses = {
    en: {
      activated: (pan, name, dob) => `✅ Account ACTIVATED! Name: ${name || 'N/A'}, DOB: ${dob || 'N/A'}. PAN ${pan} is fully activated and you can perform all transactions.`,
      notActivatedWithReview: (pan, name, dob) => `⏳ Account Under Review. Name: ${name || 'N/A'}, DOB: ${dob || 'N/A'}. PAN ${pan} is being processed. Activation typically takes 2-3 business days.`,
      notActivatedNoReview: (pan, name, dob) => `❌ Account NOT ACTIVATED. Name: ${name || 'N/A'}, DOB: ${dob || 'N/A'}. PAN ${pan} requires KYC completion. Please complete your KYC process to activate your account.`,
      notFound: (pan) => `No records found for PAN ${pan}. Please verify PAN number and try again.`,
      error: 'I apologize, but I encountered an error while processing your request. Please try again later.'
    },
    hi: {
      activated: (pan, name, dob) => `✅ आपका खाता ACTIVATED है! नाम: ${name || 'N/A'}, जन्म तिथि: ${dob || 'N/A'}. PAN ${pan} पूरी तरह से सक्रिय है और आप सभी लेनदेन कर सकते हैं।`,
      notActivatedWithReview: (pan, name, dob) => `⏳ आपका खाता समीक्षा में है। नाम: ${name || 'N/A'}, जन्म तिथि: ${dob || 'N/A'}. PAN ${pan} वर्तमान में प्रसंस्करण में है। सक्रियण में आमतौर पर 2-3 व्यावसायिक दिन लगते हैं।`,
      notActivatedNoReview: (pan, name, dob) => `❌ आपका खाता ACTIVATED नहीं है। नाम: ${name || 'N/A'}, जन्म तिथि: ${dob || 'N/A'}. PAN ${pan} को KYC पूर्णता की आवश्यकता है। कृपया अपना खाता सक्रिय करने के लिए KYC प्रक्रिया पूरी करें।`,
      notActivatedNoReview: (pan) => `❌ आपका खाता ACTIVATED नहीं है। PAN ${pan} को KYC पूर्णता की आवश्यकता है। कृपया अपना खाता सक्रिय करने के लिए KYC प्रक्रिया पूरी करें। KYC पूर्णता में सहायता के लिए समर्थन से संपर्क करें।`,
      notFound: (pan) => `PAN ${pan} के लिए कोई रिकॉर्ड नहीं मिला। कृपया PAN नंबर सत्यापित करें और फिर से कोशिश करें।`,
      error: 'माफ करें, मैं आपके अनुरोध को प्रोसेस करने में त्रुटि का सामना कर रहा हूं। कृपया बाद में फिर से कोशिश करें।'
    },
    ta: {
      activated: (pan, name, dob) => `✅ உங்கள் கணக்கு ACTIVATED செய்யப்பட்டது! பெயர்: ${name || 'N/A'}, பிறப்பிறப்பம்: ${dob || 'N/A'}. PAN ${pan} முழுமையாக செயலில் உள்ளது மற்றும் நீங்கள் அனைத்து பரிவர்த்தனைகளையும் செய்யலாம்.`,
      notActivatedWithReview: (pan, name, dob) => `⏳ உங்கள் கணக்கு மதிப்பாய்வில் உள்ளது. பெயர்: ${name || 'N/A'}, பிறப்பிறப்பம்: ${dob || 'N/A'}. PAN ${pan} தற்போது செயலாக்கப்படுகிறது. செயலாக்கத்திற்கு வழக்கமாக 2-3 வணிக நாட்கள் ஆகிறது.`,
      notActivatedNoReview: (pan, name, dob) => `❌ உங்கள் கணக்கு ACTIVATED செய்யப்படவில்லை. பெயர்: ${name || 'N/A'}, பிறப்பிறப்பம்: ${dob || 'N/A'}. PAN ${pan} க்கு KYC முடித்தல் தேவைப்படுகிறது. KYC முடித்தலுக்கு உதவிக்கு ஆதரவைத் தொடர்பு கொள்ளவும்.`,
      notFound: (pan) => `PAN ${pan} க்கு எந்த பதிவும் கிடைக்கவில்லை. தயவுசெய்து PAN எண்ணைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.`,
      error: 'மன்னிக்கவும், நான் உங்கள் கோரிக்கையைச் செயலாக்கும்போது பிழையை எதிர்கொள்கிறேன். தயவுசெய்து பின்னர் மீண்டும் முயற்சிக்கவும்.'
    },
    te: {
      activated: (pan) => `✅ మీ ఖాతా ACTIVATED అయింది! PAN ${pan} పూర్తిగా యాంత్రాంగంలో ఉంది మరియు మీరు అన్ని లావాదేవాలను చేయవచ్చు. మీ KYC ప్రక్రియ పూర్తయింది మరియు మీ ఖాతా ఉపయోగానికి సిద్ధంగా ఉంది.`,
      notActivatedWithReview: (pan) => `⏳ మీ ఖాతా సమీక్షలో ఉంది. PAN ${pan} ప్రస్తుతం ప్రాసెసింగ్‌లో ఉంది. మీ ప్రొఫైల్ సమీక్ష కొనసాగుతోంది మరియు యాక్టివేషన్‌కి సాధారణంగా 2-3 వ్యాపార రోజులు పడుతుంది. దయచేసి 2-3 రోజుల తర్వాత తిరిగి తనిఖించండి.`,
      notActivatedNoReview: (pan) => `❌ మీ ఖాతా ACTIVATED కాదు. PAN ${pan} KYC పూర్తి అవసరం. దయచేసి మీ ఖాతాను యాక్టివేట్ చేయడానికి KYC ప్రక్రియను పూర్తి చేయండి. KYC పూర్తికి సహాయం కోసం మద్దతును సంప్రదించండి.`,
      notFound: (pan) => `PAN ${pan} కోసం ఎలాంటి రికార్డులు లేవు. దయచేసి PAN నంబర్‌ను ధృవీకరించి మళ్లీ ప్రయత్నించండి.`,
      error: 'క్షమించండి, నేను మీ అభ్యర్థనను ప్రాసెస్ చేస్తున్నప్పుడు లోపాన్ని ఎదుర్కొన్నాను. దయచేసి తరువాత మళ్లీ ప్రయత్నించండి.'
    },
    kn: {
      activated: (pan) => `✅ ನಿಮ್ಮ ಖಾತೆ ACTIVATED ಆಗಿದೆ! PAN ${pan} ಸಂಪೂರ್ಣವಾಗಿ ಸಕ್ರಿಯವಾಗಿದೆ ಮತ್ತು ನೀವು ಎಲ್ಲಾ ವಹಿವಾರಗಳನ್ನು ಮಾಡಬಹುದು. ನಿಮ್ಮ KYC ಪ್ರಕ್ರಿಯೆ ಪೂರ್ಣಗೊಂಡಿದೆ ಮತ್ತು ನಿಮ್ಮ ಖಾತೆ ಬಳಕೆಗೆ ಸಿದ್ಧವಾಗಿದೆ.`,
      notActivatedWithReview: (pan) => `⏳ ನಿಮ್ಮ ಖಾತೆ ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ. PAN ${pan} ಪ್ರಸ್ತುತ ಸಂಸ್ಕರಣೆಯಲ್ಲಿದೆ. ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಪರಿಶೀಲನೆ ನಡೆಯುತ್ತಿದೆ ಮತ್ತು ಸಕ್ರಿಯಗೊಳಿಸುವಿಕೆಗೆ ಸಾಮಾನ್ಯವಾಗಿ 2-3 ವ್ಯಾಪಾರ ದಿನಗಳು ತಗಲುತ್ತವೆ. ದಯವಿಟ್ಟು 2-3 ದಿನಗಳ ನಂತರ ಮರಳಿ ಪರಿಶೀಲಿಸಿ.`,
      notActivatedNoReview: (pan) => `❌ ನಿಮ್ಮ ಖಾತೆ ACTIVATED ಆಗಿಲ್ಲ. PAN ${pan} ಗೆ KYC ಪೂರ್ಣತೆಯ ಅಗತ್ಯವಿದೆ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಖಾತೆಯನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಲು KYC ಪ್ರಕ್ರಿಯೆಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ. KYC ಪೂರ್ಣತೆಗೆ ಸಹಾಯಕ್ಕಾಗಿ ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಿ.`,
      notFound: (pan) => `PAN ${pan} ಗೆ ಯಾವುದೇ ದಾಖಲೆಗಳು ಸಿಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು PAN ಸಂಖ್ಯೆಯನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಮರಳಿ ಪ್ರಯತ್ನಿಸಿ.`,
      error: 'ಕ್ಷಮಿಸಿ, ನಾನು ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ಸಂಸ್ಕರಿಸುವಾಗ ದೋಷವನ್ನು ಎದುರಿಸುತ್ತಿದ್ದೇನೆ. ದಯವಿಟ್ಟು ನಂತರ ಮರಳಿ ಪ್ರಯತ್ನಿಸಿ.'
    }
  };
  
  const langResponses = responses[language] || responses.en;
  const pan = userQuery.toUpperCase();
  
  // Handle activation status
  if (activationStatus) {
    // Extract investor name and DOB from data
    const investorName = investorData && investorData.length > 0 ? investorData[0].InvestorName : null;
    const investorDOB = investorData && investorData.length > 0 ? 
      new Date(investorData[0].DOB).toLocaleDateString() : null;
    
    if (activationStatus.status === 'activated') {
      return langResponses.activated(pan, investorName, investorDOB);
    } else if (activationStatus.status === 'not_activated') {
      if (activationStatus.profileReviewTime && activationStatus.profileReviewTime !== null && activationStatus.profileReviewTime !== '') {
        return langResponses.notActivatedWithReview(pan, investorName, investorDOB);
      } else {
        return langResponses.notActivatedNoReview(pan, investorName, investorDOB);
      }
    } else if (activationStatus.status === 'not_found') {
      return langResponses.notFound(pan);
    }
  }
  
  // Fallback to original logic
  if (investorData && investorData.length > 0) {
    return langResponses.activated(pan);
  } else if (investorData && investorData.length === 0) {
    return langResponses.notFound(pan);
  } else {
    return langResponses.error;
  }
}

// API endpoint for PAN queries
app.post('/api/pan-query', async (req, res) => {
  const { pan, language = 'en' } = req.body;
  
  if (!dbInitialized) {
    return res.status(500).json({ 
      error: 'Database not initialized' 
    });
  }
  
  if (!pan) {
    return res.status(400).json({ 
      error: 'PAN number is required' 
    });
  }
  
  if (!isValidPAN(pan)) {
    return res.status(400).json({ 
      error: 'Invalid PAN format. Please enter a valid PAN number (e.g., ABCDE1234F).' 
    });
  }
  
  try {
    console.log(`Querying database for PAN: ${pan.toUpperCase()}`);
    
    // Query the database
    const investorData = await queryInvestorByPan(pan);
    
    console.log(`Found ${investorData.length} record(s) for PAN: ${pan.toUpperCase()}`);
    
    // Generate AI response
    const aiResponse = await generateAIResponse(investorData, pan, language);
    
    res.json({
      success: true,
      pan: pan.toUpperCase(),
      data: investorData,
      response: aiResponse,
      language: language
    });
    
  } catch (error) {
    console.error('Error processing PAN query:', error);
    res.status(500).json({ 
      error: 'Internal server error while processing your request' 
    });
  }
});

// General chat endpoint - handles queries and extracts PAN automatically
app.post('/api/chat', async (req, res) => {
  const { message, language = 'en' } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  try {
    console.log(`Received message: "${message}" in language: ${language}`);
    
    // Check if message contains a PAN number
    const panMatch = message.match(/\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/i);
    
    console.log(`PAN regex match result:`, panMatch);
    
    if (panMatch) {
      // If PAN found, redirect to PAN query
      const pan = panMatch[0];
      console.log(`PAN detected in message: ${pan}`);
      
      if (!dbInitialized) {
        return res.status(500).json({ 
          error: 'Database not initialized' 
        });
      }
      
      const investorData = await queryInvestorByPan(pan);
      const aiResponse = await generateAIResponse(investorData, pan, language);
      
      return res.json({
        response: aiResponse,
        language: language,
        escalated: false,
        panDetected: true,
        pan: pan.toUpperCase(),
        data: investorData
      });
    }
    
    // Check if user is asking about PAN-related queries but hasn't provided PAN
    const panKeywords = [
      // English keywords
      'pan', 'permanent account number', 'account number', 'investor details',
      'kyc status', 'my account', 'my details', 'investor information',
      'account details', 'check account', 'account status', 'investor account',
      'my pan', 'check pan', 'pan details', 'pan status', 'pan information',
      'activate account', 'account activation', 'kyc verification', 'kyc check',
      
      // Hindi keywords
      'पैन', 'परमानेंट अकाउंट नंबर', 'खाता', 'निवेशक विवरण', 'केवाईसी स्थिति',
      'मेरा खाता', 'मेरा पैन', 'खाता की जानकारी', 'खाता स्थिति',
      
      // Tamil keywords
      'போன்', 'கணக்கு', 'நிவேசகர் விவரங்கள்', 'கேவிசி நிலை',
      'என் கணக்கு', 'கணக்கு விவரங்கள்', 'கணக்கு நிலை',
      'என்னச்சு', 'என்ன', 'எனன்ன', 'நிலை என்னச்சு', 'ஸ்டேட்டஸ்', 'ஸ்டேடஸ்',
      
      // Telugu keywords
      'ప్యాన్', 'ఖాతా', 'నివేశక వివరాలు', 'కేవైసీ స్థితి',
      'నా ఖాతా', 'నా ప్యాన్', 'ఖాతా వివరాలు', 'ఖాతా స్థితి',
      
      // Kannada keywords
      'ಪ್ಯಾನ್', 'ಖಾತೆ', 'ನಿವೇಶಕ ಮಾಹಿತಿ', 'ಕೇವೈಸೀ ಸ್ಥಿತಿ',
      'ನನ್ನ ಖಾತೆ', 'ನನ್ನ ಪ್ಯಾನ್', 'ಖಾತೆ ಮಾಹಿತಿ', 'ಖಾತೆ ಸ್ಥಿತಿ'
    ];
    
    console.log(`Processing message: "${message}"`);
    console.log(`Message lowercase: "${message.toLowerCase()}"`);
    
    // Fuzzy matching function - calculates similarity between two strings
    function calculateSimilarity(str1, str2) {
      const longer = str1.length > str2.length ? str1 : str2;
      const shorter = str1.length > str2.length ? str2 : str1;
      
      if (longer.length === 0) return 1.0;
      
      const editDistance = levenshteinDistance(longer, shorter);
      return (longer.length - editDistance) / longer.length;
    }
    
    // Simple Levenshtein distance implementation
    function levenshteinDistance(str1, str2) {
      const matrix = [];
      
      for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
      }
      
      for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
      }
      
      for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
          if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
          }
        }
      }
      
      return matrix[str2.length][str1.length];
    }
    
    // Check for partial matches and calculate overall confidence
    let maxSimilarity = 0;
    let bestMatch = '';
    const messageWords = message.toLowerCase().split(/\s+/);
    
    panKeywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      
      // Check for exact substring match first
      if (message.toLowerCase().includes(keywordLower)) {
        maxSimilarity = 1.0;
        bestMatch = keyword;
        return;
      }
      
      // Check for word-by-word similarity
      const keywordWords = keywordLower.split(/\s+/);
      let totalSimilarity = 0;
      let matchedWords = 0;
      
      keywordWords.forEach(kWord => {
        messageWords.forEach(mWord => {
          const similarity = calculateSimilarity(kWord, mWord);
          if (similarity > 0.7) { // 70% similarity threshold for individual words
            totalSimilarity += similarity;
            matchedWords++;
          }
        });
      });
      
      if (matchedWords > 0) {
        const avgSimilarity = totalSimilarity / matchedWords;
        if (avgSimilarity > maxSimilarity) {
          maxSimilarity = avgSimilarity;
          bestMatch = keyword;
        }
      }
    });
    
    // Consider it a PAN-related query if we have at least 60% confidence
    const isPanRelatedQuery = maxSimilarity >= 0.6;
    
    console.log(`Best match: "${bestMatch}" with similarity: ${maxSimilarity.toFixed(2)}`);
    console.log(`PAN-related keywords match result: ${isPanRelatedQuery}`);
    
    if (isPanRelatedQuery) {
      // Ask for PAN number in the selected language
      const askForPANResponses = {
        en: `I can help you with your investor details! To proceed, please provide your PAN number (Permanent Account Number).

Format: 5 letters followed by 4 numbers and 1 letter (e.g., ABCDE1234F)

Example: You can say "My PAN is ABCDE1234F" or simply enter "ABCDE1234F"`,
        
        hi: `main aapke investor details mein madad kar sakta hun! aage badhne ke liye, kripya aapna PAN number (Permanent Account Number) provide kijiye.

Format: 5 akshar ke baad 4 sankhya aur 1 akshar (jaise ABCDE1234F)

Udaharan: aap keh sakte hain "Mera PAN ABCDE1234F hai" ya sirf "ABCDE1234F" enter karein`,
        
        ta: `Naan unga investor details la help pannalaen! munporaduka, unga PAN number (Permanent Account Number) provide pannunga.

Format: 5 eluttukal pinbu 4 ennum oru eluttu (example: ABCDE1234F)

Example: Neenga "En PAN ABCDE1234F" nu sollalaem ya "ABCDE1234F" ah enter pannalaem`,
        
        te: `Nenu meeru investor details lo help chestanu! munduku vellalappudu, meeru PAN number (Permanent Account Number) ivvandi.

Format: 5 aksharala taruvata 4 numbers okka akshar (example: ABCDE1234F)

Example: Meeru "Na PAN ABCDE1234F" ane cheppachu, leka "ABCDE1234F" enter chestamu`,
        
        kn: `Nanu nimmavara investor details alli help maduttene. munde hogalike, nimmavara PAN number (Permanent Account Number) provide madi.

Format: 5 aksharadinda hage 4 ankagalu mattu 1 akshara (example: ABCDE1234F)

Example: Neenu "Nanna PAN ABCDE1234F" anta helabeku athava "ABCDE1234F" enter mabeku`
      };
      
      const askForPANResponse = askForPANResponses[language] || askForPANResponses.en;
      
      return res.json({
        response: askForPANResponse,
        language: language,
        escalated: false,
        askingForPAN: true
      });
    }
    
    // For non-PAN messages, check if user wants to know their activation status
    if (isPanRelatedQuery && !panMatch) {
      // User is asking about account status but didn't provide PAN
      // Check if this is a general activation status query (no specific PAN provided)
      const activationStatusKeywords = [
        'activation status', 'account status', 'my status', 'check status',
        'kyc status', 'kyc', 'status', 'நிலை', 'ஸ்டேட்டஸ்', 'ஸ்டேடஸ்',
        'செயலில் உள்ளதா வில்லை', 'యాక్టివేషన్ స్థితి', 'ಖಾತೆಯ ಸ್ಥಿತಿ', 
        'सक्रिय स्थिति', 'खाते की स्थिति', 'खाता स्थिति'
      ];
      
      const isActivationStatusQuery = activationStatusKeywords.some(keyword => 
        message.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (isActivationStatusQuery) {
        // User wants to know activation status but didn't provide PAN
        // Provide general activation status information
        const generalStatusResponses = {
          en: `To check your account activation status, please provide your PAN number (Permanent Account Number).

Once you provide your PAN, I can tell you:
✅ If your account is ACTIVATED (AllowTransact = 'A')
⏳ If your account is UNDER REVIEW (ProfileReviewTime exists)
❌ If your account is NOT ACTIVATED and needs KYC completion

Format: 5 letters followed by 4 numbers and 1 letter (e.g., ABCDE1234F)

Example: You can say "My PAN is ABCDE1234F" or simply enter "ABCDE1234F"`,
          
          hi: `अपने खाते सक्रियण स्थिति जानने के लिए, कृपया अपना PAN नंबर (Permanent Account Number) provide कीजिए।

एक बार PAN प्रदाने के बाद, मैं आपको बता सकता हूंगा:
✅ यदि आपका खाता ACTIVATED है (AllowTransact = 'A')
⏳ यदि आपका खाता समीक्षा में है (ProfileReviewTime मौजूद है)
❌ यदि आपका खाता ACTIVATED नहीं है और KYC पूर्णता की आवश्यकता है

प्रारूप: 5 अक्षर के बाद 4 अंक और 1 अक्षर (जैसे ABCDE1234F)`,
          
          ta: `உங்கள் கணக்கு செயலில் உள்ளது என்ன சொல்லப்படும் பார்க்கலாம்! உங்கள் PAN எண் (Permanent Account Number) provide பண்ணும்.

ஒரு PAN வழங்கியவதும், நான் உங்கள் சொல்லப்படும் பார்க்கலாம்:
✅ உங்கள் கணக்கு ACTIVATED செய்யப்பட்டது (AllowTransact = 'A')
⏳ உங்கள் கணக்கு மதிப்பாய்வில் உள்ளது (ProfileReviewTime உள்ளது)
❌ உங்கள் கணக்கு ACTIVATED செய்யப்படவில்லை மற்றும் KYC முடித்தல் தேவைப்படுகிறது

வடிவமம்: 5 எழுத்துக்குப் பின்ன 4 எண் மற்றும் 1 எழுத்துக்கு (உதாரணம் ABCDE1234F)`,
          
          te: `మీరు ఖాతా యాక్టివేషన్ స్థితి తెలుస్కోవచ్చు! మీరు PAN నంబర్ (Permanent Account Number) ఇచ్చిండి.

ఒక PAN ఇచ్చిండి తర్వాతమం, నేను మీ ఖాతా స్థితి తెలుస్తోవచ్చు:
✅ మీ ఖాతా ACTIVATED అయింది (AllowTransact = 'A')
⏳ మీ ఖాతా సమీక్షలో ఉంది (ProfileReviewTime ఉంది)
❌ మీ ఖాతా ACTIVATED కాదు మరియు KYC పూర్తి అవసరం

ఫార్మాట్: 5 అక్షరల తరువాత 4 సంఖ్యల మరియు 1 అక్షర (ఉదాహరణం ABCDE1234F)`,
          
          kn: `ನಾನು ನಿಮ್ಮ ಖಾತೆಯ ಸಕ್ರಿಯ ಸ್ಥಿತಿ ತಿಳಿಸುತ್ತೇನೆ! ನಿಮ್ಮ PAN ಸಂಖ್ಯೆ (Permanent Account Number) provide ಮಾಡಿ.

ಒಂದು PAN ನೀಡಿಸಿದರೆ, ನಾನು ನಿಮ್ಮ ಖಾತೆಯ ಸ್ಥಿತಿ ತೆಲುಸ್ತೋವಚ್ಚು:
✅ ನಿಮ್ಮ ಖಾತೆ ACTIVATED ಆಗಿದೆ (AllowTransact = 'A')
⏳ ನಿಮ್ಮ ಖಾತೆ ಪರಿಶೀಲನೆಯಲ್ಲಿ ಉಂದಿ (ProfileReviewTime ಇದೆ)
❌ ನಿಮ್ಮ ಖಾತೆ ACTIVATED ಆಗಲಿಲ್ಲ ಮರಿಯು KYC ಪೂರ್ಣತೆಯ ಅಗತ್ಯವಿದೆ

ಫಾರ್ಮಾಟ್: 5 ಅಕ್ಷರಗಳ ನಂತರ 4 ಸಂಖ್ಯೆಗಳು ಮತ್ತು 1 ಅಕ್ಷರ (ಉದಾಹರಣಂ ABCDE1234F)`
        };
        
        const generalStatusResponse = generalStatusResponses[language] || generalStatusResponses.en;
        
        return res.json({
          response: generalStatusResponse,
          language: language,
          escalated: false,
          askingForPAN: true
        });
      }
      
      // User is asking about PAN-related but not providing PAN
      const askForPANResponses = {
        en: `I can help you with your investor details! To proceed, please provide your PAN number (Permanent Account Number).

Format: 5 letters followed by 4 numbers and 1 letter (e.g., ABCDE1234F)

Example: You can say "My PAN is ABCDE1234F" or simply enter "ABCDE1234F"`,
        
        hi: `main aapke investor details mein madad kar sakta hun! aage badhne ke liye, kripya aapna PAN number (Permanent Account Number) provide kijiye.

Format: 5 akshar ke baad 4 sankhya aur 1 akshar (jaise ABCDE1234F)

Udaharan: aap keh sakte hain "Mera PAN ABCDE1234F hai" ya sirf "ABCDE1234F" enter karein`,
        
        ta: `Naan unga investor details la help pannalaen! munporaduka, unga PAN number (Permanent Account Number) provide pannunga.

Format: 5 eluttukal pinbu 4 ennum oru eluttu (example: ABCDE1234F)

Example: Neenga "En PAN ABCDE1234F" nu sollalaem ya "ABCDE1234F" ah enter pannalaem`,
        
        te: `Nenu meeru investor details lo help chestanu! munduku vellalappudu, meeru PAN number (Permanent Account Number) ivvandi.

Format: 5 aksharala taruvata 4 numbers okka akshar (example: ABCDE1234F)

Example: Meeru "Na PAN ABCDE1234F" ane cheppachu leka "ABCDE1234F" enter chestamu`,
        
        kn: `Nanu nimmavara investor details alli help maduttene. munde hogalike, nimmavara PAN number (Permanent Account Number) provide madi.

Format: 5 aksharadinda hage 4 ankagalu mattu 1 akshara (example: ABCDE1234F)

Example: Neenu "Nanna PAN ABCDE1234F" anta helabeku athava "ABCDE1234F" enter mabeku`
      };
      
      const askForPANResponse = askForPANResponses[language] || askForPANResponses.en;
      
      return res.json({
        response: askForPANResponse,
        language: language,
        escalated: false,
        askingForPAN: true
      });
    }
    
    // For non-PAN messages, use regular AI service
    const intent = 'general_query';
    const response = await aiService.generateResponse(intent, message, language);
    
    res.json({
      response,
      language,
      escalated: false
    });
    
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    dbInitialized,
    timestamp: new Date().toISOString()
  });
});

// Serve the smart chat HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'chat-pan-query.html'));
});

// Serve the dedicated PAN query interface
app.get('/pan-query', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'pan-query.html'));
});

// Serve the original chat interface
app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`PAN Query Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
  initializeServer();
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  try {
    await closeConnection();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});
