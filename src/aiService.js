const axios = require('axios');

class AIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseURL = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
    this.model = process.env.AI_MODEL || 'gpt-3.5-turbo';
    this.maxTokens = parseInt(process.env.AI_MAX_TOKENS) || 300;
    this.temperature = parseFloat(process.env.AI_TEMPERATURE) || 0.7;
    this.isGemini = this.baseURL.includes('generativelanguage.googleapis.com');
    
    // Fallback models for high demand situations
    this.fallbackModels = [
      "gemini-2.5-flash",
      "gemini-2.0-flash-lite", 
      "gemini-2.5-flash-lite"
    ];
  }

  async generateResponse(intent, message, language, context = {}) {
    // If no AI API key configured, fallback to template
    if (!this.apiKey || process.env.DEMO_MODE === 'true') {
      return this.generateFallbackResponse(intent, message, language);
    }

    try {
      if (this.isGemini) {
        return await this.generateGeminiResponse(intent, message, language, context);
      } else {
        return await this.generateOpenAIResponse(intent, message, language, context);
      }
    } catch (error) {
      console.error('AI Service Error:', error.response?.data || error.message);
      return this.generateFallbackResponse(intent, message, language);
    }
  }

  async generateOpenAIResponse(intent, message, language, context) {
    const systemPrompt = this.buildSystemPrompt(intent, language, context);
    const userPrompt = this.buildUserPrompt(message, language, context);

    const response = await axios.post(
      `${this.baseURL}/chat/completions`,
      {
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content.trim();
  }

  async generateGeminiResponse(intent, message, language, context, modelIndex = 0) {
    const systemPrompt = this.buildSystemPrompt(intent, language, context);
    const userPrompt = this.buildUserPrompt(message, language, context);
    const fullPrompt = `${systemPrompt}\n\nCustomer: ${userPrompt}`;

    const modelToTry = modelIndex === 0 ? this.model : this.fallbackModels[modelIndex - 1];
    
    try {
      const response = await axios.post(
        `${this.baseURL}/models/${modelToTry}:generateContent?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{
              text: fullPrompt
            }]
          }],
          generationConfig: {
            temperature: this.temperature,
            maxOutputTokens: this.maxTokens,
            topP: 1
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
      console.error(`Gemini API Error for model ${modelToTry}:`, error.response?.data || error.message);
      
      // If high demand error and we have more fallback models, try next one
      if (error.response?.data?.error?.code === 503 && modelIndex < this.fallbackModels.length) {
        console.warn(`Model ${modelToTry} unavailable, trying fallback model...`);
        return await this.generateGeminiResponse(intent, message, language, context, modelIndex + 1);
      }
      
      // If quota exceeded, wait and retry with exponential backoff
      if (error.response?.data?.error?.code === 429) {
        const waitTime = Math.pow(2, modelIndex + 1) * 1000; // 2s, 4s, 8s
        console.warn(`Rate limited. Retrying in ${waitTime/1000} seconds with model ${modelToTry}...`);
        
        setTimeout(async () => {
          return await this.generateGeminiResponse(intent, message, language, context, modelIndex);
        }, waitTime);
      }
      
      // Otherwise rethrow the error
      throw error;
    }
  }

  buildSystemPrompt(intent, language, context) {
    const languageMap = {
      'en': 'English',
      'hi': 'Hindi (Devanagari script)',
      'ta': 'Tamil (Tamil script)',
      'te': 'Telugu (Telugu script)',
      'kn': 'Kannada (Kannada script)'
    };

    const responseLanguage = languageMap[language] || 'English';

    return `You are a professional banking customer support agent for an Indian bank. 

Your role is to provide helpful, accurate, and empathetic responses to customer queries.

Guidelines:
1. Respond in ${responseLanguage} language
2. Be professional yet friendly and empathetic
3. Provide specific, actionable advice when possible
4. For banking queries, mention standard procedures and timelines
5. If you don't know something, be honest and suggest alternatives
6. Keep responses concise but comprehensive
7. For security issues, always recommend immediate action
8. Use appropriate formal/informal tone based on the language

Current intent: ${intent}
Customer language: ${responseLanguage}

Banking Context:
- KYC processing typically takes 2-3 working days
- Failed transactions auto-reverse within 24 hours
- Account balance can be checked via mobile app, USSD (*123#), or ATM
- Lost cards should be blocked immediately via app or by calling 1800-XXX-XXXX
- Net banking issues can be resolved via "Forgot Password" or by waiting 30 minutes for account lock
- Branch hours: 9:30 AM to 4:30 PM (Mon-Fri), 9:30 AM to 1:30 PM (Sat)
- For emergencies, call 1800-XXX-XXXX immediately

${context.escalated ? 'HIGH PRIORITY: This query has been flagged for escalation. Provide immediate assistance and clearly state that a human agent will follow up.' : ''}

Remember: You are representing the bank. Be helpful, accurate, and professional.`;
  }

  buildUserPrompt(message, language, context) {
    let prompt = `Customer query: ${message}`;
    
    if (context.englishMessage) {
      prompt += `\n\nEnglish translation: ${context.englishMessage}`;
    }
    
    if (context.previousMessages && context.previousMessages.length > 0) {
      prompt += `\n\nPrevious conversation context:`;
      context.previousMessages.slice(-3).forEach((msg, index) => {
        prompt += `\n${index + 1}. ${msg.isUser ? 'Customer' : 'Agent'}: ${msg.text}`;
      });
    }
    
    return prompt;
  }

  generateFallbackResponse(intent, message, language) {
    // Fallback to template-based responses when AI is unavailable
    const { generateResponse: generateTemplateResponse } = require('./templateResponses');
    return generateTemplateResponse(intent, language, false);
  }

  async validateResponse(response, intent) {
    // Basic validation to ensure response is appropriate
    if (!response || response.length < 10) {
      return false;
    }

    // Check for harmful content (basic implementation)
    const harmfulPatterns = [
      /kill|death|suicide|harm/i,
      /illegal|fraud.*how.*to/i,
      /hack|crack|exploit/i
    ];

    for (const pattern of harmfulPatterns) {
      if (pattern.test(response)) {
        return false;
      }
    }

    return true;
  }

  async moderateContent(text) {
    // Basic content moderation
    const prohibitedPatterns = [
      /abuse|threat|harass/i,
      /curse|swear|profanity/i,
      /spam|advertisement/i
    ];

    for (const pattern of prohibitedPatterns) {
      if (pattern.test(text)) {
        return true; // Content needs moderation
      }
    }

    return false;
  }
}

module.exports = new AIService();
