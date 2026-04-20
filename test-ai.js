// Test AI integration
const { generateResponse } = require('./src/responseGenerator');

async function testAI() {
  try {
    console.log('Testing AI response generation...');
    
    const response = await generateResponse(
      'KYC_STATUS',
      'en',
      false,
      'What is my KYC status?',
      {}
    );
    
    console.log('AI Response:', response);
    console.log('Test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAI();
