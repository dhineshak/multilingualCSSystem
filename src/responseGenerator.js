const { generateResponse: generateTemplateResponse, responseTemplates } = require('./templateResponses');
const aiService = require('./aiService');

async function generateResponse(intent, language, escalated = false, message = '', context = {}) {
  try {
    // Use AI service for dynamic responses
    const aiResponse = await aiService.generateResponse(intent, message, language, {
      escalated,
      ...context
    });
    
    // Validate AI response
    const isValidResponse = await aiService.validateResponse(aiResponse, intent);
    
    if (isValidResponse) {
      return aiResponse;
    } else {
      console.warn('AI response validation failed, using template fallback');
      return generateTemplateResponse(intent, language, escalated);
    }
  } catch (error) {
    console.error('Error generating AI response:', error);
    // Fallback to template-based response
    return generateTemplateResponse(intent, language, escalated);
  }
}

// Synchronous version for backward compatibility
function generateResponseSync(intent, language, escalated = false) {
  return generateTemplateResponse(intent, language, escalated);
}

module.exports = { 
  generateResponse, 
  generateResponseSync,
  responseTemplates: require('./templateResponses').responseTemplates 
};
