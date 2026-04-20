// Intent definitions for customer support queries
const intents = {
  KYC_STATUS: {
    keywords: ['kyc', 'know your customer', 'verification', 'identity', 'document', 'pending', 'approved', 'rejected'],
    patterns: [
      /kyc.*status/i,
      /verification.*status/i,
      /identity.*verification/i,
      /document.*status/i
    ],
    priority: 'high'
  },
  
  TRANSACTION_ISSUE: {
    keywords: ['transaction', 'payment', 'transfer', 'failed', 'pending', 'successful', 'declined', 'refund'],
    patterns: [
      /transaction.*failed/i,
      /payment.*issue/i,
      /transfer.*not.*working/i,
      /refund.*status/i
    ],
    priority: 'high'
  },
  
  ACCOUNT_BALANCE: {
    keywords: ['balance', 'amount', 'money', 'account', 'available', 'current'],
    patterns: [
      /account.*balance/i,
      /how.*much.*money/i,
      /available.*balance/i,
      /current.*balance/i
    ],
    priority: 'medium'
  },
  
  ACCOUNT_INFO: {
    keywords: ['account', 'details', 'information', 'number', 'type', 'opening'],
    patterns: [
      /account.*details/i,
      /account.*information/i,
      /my.*account/i
    ],
    priority: 'medium'
  },
  
  CARD_ISSUE: {
    keywords: ['card', 'atm', 'debit', 'credit', 'blocked', 'lost', 'stolen', 'pin'],
    patterns: [
      /card.*blocked/i,
      /atm.*card/i,
      /debit.*card/i,
      /credit.*card/i,
      /card.*lost/i
    ],
    priority: 'high'
  },
  
  LOAN_QUERY: {
    keywords: ['loan', 'emi', 'interest', 'payment', 'due', 'amount', 'personal', 'home'],
    patterns: [
      /loan.*status/i,
      /emi.*payment/i,
      /loan.*interest/i,
      /loan.*application/i
    ],
    priority: 'medium'
  },
  
  NET_BANKING: {
    keywords: ['netbanking', 'online', 'login', 'password', 'internet', 'banking', 'access'],
    patterns: [
      /netbanking.*login/i,
      /online.*banking/i,
      /internet.*banking/i,
      /login.*issue/i
    ],
    priority: 'medium'
  },
  
  MOBILE_APP: {
    keywords: ['mobile', 'app', 'application', 'phone', 'smartphone', 'download'],
    patterns: [
      /mobile.*app/i,
      /phone.*application/i,
      /app.*download/i
    ],
    priority: 'low'
  },
  
  BRANCH_INFO: {
    keywords: ['branch', 'location', 'address', 'timing', 'hours', 'near', 'closest'],
    patterns: [
      /branch.*location/i,
      /nearest.*branch/i,
      /branch.*timing/i
    ],
    priority: 'low'
  },
  
  GENERAL_GREETING: {
    keywords: ['hello', 'hi', 'good morning', 'good evening', 'help', 'support'],
    patterns: [
      /^(hello|hi|hey)/i,
      /good.*morning/i,
      /good.*evening/i,
      /need.*help/i
    ],
    priority: 'low'
  },
  
  COMPLAINT: {
    keywords: ['complaint', 'issue', 'problem', 'dissatisfied', 'service', 'bad'],
    patterns: [
      /file.*complaint/i,
      /service.*issue/i,
      /complain.*about/i
    ],
    priority: 'high'
  },
  
  BLOCK_ACCOUNT: {
    keywords: ['block', 'freeze', 'suspend', 'close', 'deactivate'],
    patterns: [
      /block.*account/i,
      /freeze.*account/i,
      /close.*account/i
    ],
    priority: 'high'
  }
};

function identifyIntent(text) {
  if (!text || typeof text !== 'string') {
    return 'UNKNOWN';
  }
  
  const lowerText = text.toLowerCase().trim();
  let bestMatch = 'UNKNOWN';
  let highestScore = 0;
  
  // Score each intent based on keyword matches and patterns
  for (const [intentName, intentData] of Object.entries(intents)) {
    let score = 0;
    
    // Check keyword matches
    for (const keyword of intentData.keywords) {
      if (lowerText.includes(keyword)) {
        score += 2;
      }
    }
    
    // Check pattern matches
    for (const pattern of intentData.patterns) {
      if (pattern.test(lowerText)) {
        score += 3;
      }
    }
    
    // Add priority bonus
    if (intentData.priority === 'high') {
      score += 1;
    }
    
    if (score > highestScore) {
      highestScore = score;
      bestMatch = intentName;
    }
  }
  
  // Return UNKNOWN if no good match found
  return highestScore >= 2 ? bestMatch : 'UNKNOWN';
}

function getIntentInfo(intent) {
  return intents[intent] || null;
}

module.exports = { identifyIntent, intents, getIntentInfo };
