// Escalation logic for complex queries
const escalationKeywords = [
  'legal',
  'lawyer',
  'court',
  'police',
  'fraud',
  'scam',
  'complaint manager',
  'branch manager',
  'senior officer',
  'regulatory',
  'rbi',
  'ombudsman',
  'serious issue',
  'emergency',
  'urgent',
  'complex',
  'not working for long',
  'multiple attempts',
  'dissatisfied',
  'unhappy',
  'terrible service',
  'worst experience',
  'report issue',
  'file complaint',
  'sue',
  'legal action'
];

const complexIntents = [
  'COMPLAINT',
  'BLOCK_ACCOUNT'
];

function shouldEscalate(intent, message) {
  if (!message || typeof message !== 'string') {
    return false;
  }
  
  const lowerMessage = message.toLowerCase();
  
  // Check for escalation keywords
  for (const keyword of escalationKeywords) {
    if (lowerMessage.includes(keyword)) {
      return true;
    }
  }
  
  // Check for complex intents
  if (complexIntents.includes(intent)) {
    return true;
  }
  
  // Check for repeated patterns (user is frustrated)
  const frustrationIndicators = [
    /(very|too|so).*(bad|terrible|awful|poor)/i,
    /not.*helpful/i,
    /waste.*time/i,
    /multiple.*times/i,
    /again.*and.*again/i,
    /no.*response/i,
    /waiting.*long/i
  ];
  
  for (const pattern of frustrationIndicators) {
    if (pattern.test(lowerMessage)) {
      return true;
    }
  }
  
  // Check for very long messages (might indicate complex issue)
  if (lowerMessage.length > 300) {
    return true;
  }
  
  return false;
}

function generateEscalationContext(message, intent, language) {
  return {
    originalMessage: message,
    intent: intent,
    language: language,
    timestamp: new Date().toISOString(),
    escalationReason: detectEscalationReason(message),
    priority: determinePriority(message, intent),
    suggestedAgentType: suggestAgentType(intent)
  };
}

function detectEscalationReason(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('fraud') || lowerMessage.includes('scam')) {
    return 'Security/Fraud Issue';
  }
  
  if (lowerMessage.includes('legal') || lowerMessage.includes('court') || lowerMessage.includes('lawyer')) {
    return 'Legal Matter';
  }
  
  if (lowerMessage.includes('complaint') || lowerMessage.includes('dissatisfied')) {
    return 'Service Complaint';
  }
  
  if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent')) {
    return 'Emergency';
  }
  
  if (lowerMessage.includes('complex') || lowerMessage.length > 300) {
    return 'Complex Query';
  }
  
  return 'General Escalation';
}

function determinePriority(message, intent) {
  const lowerMessage = message.toLowerCase();
  
  // High priority indicators
  if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent') || 
      lowerMessage.includes('fraud') || lowerMessage.includes('scam')) {
    return 'HIGH';
  }
  
  // Medium priority for complex intents
  if (complexIntents.includes(intent)) {
    return 'MEDIUM';
  }
  
  return 'NORMAL';
}

function suggestAgentType(intent) {
  const agentMapping = {
    'COMPLAINT': 'Customer Relations',
    'BLOCK_ACCOUNT': 'Security Team',
    'CARD_ISSUE': 'Card Services',
    'LOAN_QUERY': 'Loan Department',
    'TRANSACTION_ISSUE': 'Transaction Support',
    'KYC_STATUS': 'KYC Team'
  };
  
  return agentMapping[intent] || 'General Support';
}

module.exports = { 
  shouldEscalate, 
  generateEscalationContext, 
  detectEscalationReason, 
  determinePriority, 
  suggestAgentType 
};
