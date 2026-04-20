# Multilingual Customer Support Agent

An AI-powered customer support chatbot that handles banking queries in multiple Indian regional languages.

## Features

- **AI-Powered Responses**: Dynamic responses using OpenAI GPT models
- **Multi-language Support**: English, Hindi, Tamil, Telugu, Kannada
- **Intent Recognition**: Understands 20+ common banking queries
- **Smart Fallback**: Template responses when AI is unavailable
- **Smart Escalation**: Detects complex queries and escalates to human agents
- **Real-time Translation**: Processes queries in regional languages
- **Content Validation**: AI response validation and content moderation
- **Modern UI**: Clean, responsive chat interface

## Supported Query Types

1. **KYC Related**
   - KYC status inquiries
   - Document verification status
   - Identity verification issues

2. **Transaction Issues**
   - Failed transactions
   - Payment problems
   - Transfer issues
   - Refund status

3. **Account Information**
   - Balance inquiries
   - Account details
   - Account statements

4. **Card Services**
   - Lost/stolen cards
   - PIN reset
   - Card blocking
   - New card requests

5. **Loan Queries**
   - EMI information
   - Loan status
   - Interest details

6. **Digital Banking**
   - Net banking issues
   - Mobile app problems
   - Login difficulties

7. **General Support**
   - Branch information
   - Service complaints
   - General assistance

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm run install-all
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:5000`

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server configuration
PORT=5000
NODE_ENV=development

# Google Translate API (optional - for production)
# GOOGLE_TRANSLATE_API_KEY=your_api_key_here

# Demo mode settings
DEMO_MODE=true
MOCK_RESPONSES=true
```

## Project Structure

```
multilingual-support-agent/
|-- src/
|   |-- languageDetection.js    # Detects user language
|   |-- translation.js          # Handles text translation
|   |-- intentRecognition.js    # Identifies query intent
|   |-- responseGenerator.js    # Generates responses
|   |-- escalation.js           # Escalation logic
|-- client/
|   |-- index.html              # Frontend chat interface
|-- server.js                   # Express server
|-- package.json                # Dependencies
```

## API Endpoints

### POST /api/chat
Main chat endpoint for processing user messages.

**Request:**
```json
{
  "message": "What is my KYC status?",
  "language": "hi"
}
```

**Response:**
```json
{
  "response": "aapka kyc status pending hai",
  "language": "hi",
  "intent": "KYC_STATUS",
  "escalated": false,
  "originalMessage": "mera kyc status kya hai?",
  "englishMessage": "what is my kyc status?"
}
```

### POST /api/detect-language
Detects the language of input text.

### GET /api/languages
Returns list of supported languages.

## Demo Usage

1. Open the web interface
2. Select your preferred language using the language buttons
3. Try the demo queries or type your own message
4. The bot will respond in your selected language

## Language Support

The system supports the following languages:

- **English** (en)
- **Hindi** (hi) - Devanagari script
- **Tamil** (ta) - Tamil script  
- **Telugu** (te) - Telugu script
- **Kannada** (kn) - Kannada script

## Escalation System

The system automatically escalates queries when:

- Fraud or security issues are detected
- Legal matters are mentioned
- User expresses extreme dissatisfaction
- Complex or lengthy queries
- Emergency situations

Escalated queries are flagged for human agent intervention with full context.

## Production Deployment

For production use:

1. Set `DEMO_MODE=false` in `.env`
2. Add Google Translate API key for better translation
3. Set up proper SSL certificates
4. Configure load balancing
5. Set up monitoring and logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For technical support or questions:
- Create an issue in the repository
- Contact the development team

---

**Note**: This is a demonstration system. In production, integrate with actual banking systems and databases for real customer data.
