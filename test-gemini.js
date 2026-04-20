// Test script to check Gemini API availability
const axios = require('axios');

async function testGeminiModels() {
  const apiKey = process.env.OPENAI_API_KEY || 'AIzaSyCoQttmhooMtqJbeLxxNKMibPI1-NefzEw';
  
  try {
    // Try to list available models
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
    );
    
    console.log('Available Gemini Models:');
    response.data.models.forEach(model => {
      console.log(`- ${model.name} (supports: ${model.supportedGenerationMethods.join(', ')})`);
    });
    
  } catch (error) {
    console.error('Error fetching models:', error.response?.data || error.message);
  }
}

testGeminiModels();
