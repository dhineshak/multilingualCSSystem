const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/build')));

// Import chatbot modules
const { detectLanguage } = require('./src/languageDetection');
const { translateText } = require('./src/translation');
const { identifyIntent } = require('./src/intentRecognition');
const { generateResponse } = require('./src/responseGenerator');
const { shouldEscalate } = require('./src/escalation');

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, language } = req.body;
    
    // Detect language if not provided
    const detectedLanguage = language || detectLanguage(message);
    
    // Translate to English for processing
    const englishMessage = await translateText(message, detectedLanguage, 'en');
    
    // Identify intent
    const intent = identifyIntent(englishMessage);
    
    // Check if escalation is needed
    const escalate = shouldEscalate(intent, englishMessage);
    
    // Generate response using AI
    const response = await generateResponse(intent, detectedLanguage, escalate, englishMessage, {
      englishMessage,
      originalMessage: message,
      previousMessages: [] // TODO: Implement conversation history
    });
    
    // Translate response back to user's language
    const finalResponse = await translateText(response, 'en', detectedLanguage);
    
    res.json({
      response: finalResponse,
      language: detectedLanguage,
      intent: intent,
      escalated: escalate,
      originalMessage: message,
      englishMessage: englishMessage
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Language detection endpoint
app.post('/api/detect-language', (req, res) => {
  try {
    const { text } = req.body;
    const language = detectLanguage(text);
    res.json({ language });
  } catch (error) {
    res.status(500).json({ error: 'Language detection failed' });
  }
});

// Get supported languages
app.get('/api/languages', (req, res) => {
  res.json({
    languages: [
      { code: 'hi', name: 'Hindi', native: ' Hindi' },
      { code: 'ta', name: 'Tamil', native: ' Tamil' },
      { code: 'te', name: 'Telugu', native: ' Telugu' },
      { code: 'kn', name: 'Kannada', native: ' Kannada' },
      { code: 'en', name: 'English', native: 'English' }
    ]
  });
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
