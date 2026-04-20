# Setup Instructions for Multilingual Customer Support Agent

## Prerequisites
- Node.js (v14 or higher) - Download from https://nodejs.org/
- npm (comes with Node.js)

## Quick Setup

### 1. Install Dependencies
```bash
# Install server dependencies
npm install

# The project uses React via CDN, so no client-side npm install needed
```

### 2. Environment Configuration
The `.env` file is already configured for demo mode:
```env
PORT=5000
NODE_ENV=development
DEMO_MODE=true
MOCK_RESPONSES=true
```

### 3. Start the Application
```bash
npm start
```

### 4. Access the Application
Open your browser and navigate to: `http://localhost:5000`

## Demo Features

### Language Support
- **English** - Full support
- **Hindi** - Devanagari script support
- **Tamil** - Tamil script support  
- **Telugu** - Telugu script support
- **Kannada** - Kannada script support

### Try These Demo Queries

#### English Examples:
- "What is my KYC status?"
- "My transaction failed"
- "What is my account balance?"
- "I lost my debit card"
- "Help me with net banking"

#### Hindi Examples:
- "Mera KYC status kya hai?"
- "Mera transaction fail ho gaya"
- "Mera account balance kitna hai?"
- "Mera debit card kho gaya"
- "Net banking mein help karein"

#### Tamil Examples:
- "Enna KYC status?"
- "En transaction aagala"
- "En account balance enna?"
- "En debit card azhagiyachu"
- "Net banking la help pannunga"

#### Telugu Examples:
- "Naa KYC status emi?"
- "Naa transaction ayindi"
- "Naa account balance emi?"
- "Naa debit card pothundi"
- "Net banking lo help cheyandi"

#### Kannada Examples:
- "Nanna KYC status enu?"
- "Nanna transaction aagilla"
- "Nanna account balance enu?"
- "Nanna debit card hogayide"
- "Net banking alli help madi"

## System Architecture

### Backend Components
1. **Language Detection** - Identifies user language automatically
2. **Translation Engine** - Converts between regional languages and English
3. **Intent Recognition** - Understands 20+ banking query types
4. **Response Generator** - Creates appropriate responses
5. **Escalation System** - Flags complex queries for human agents

### Frontend Features
- Modern chat interface
- Language selection buttons
- Demo query suggestions
- Real-time typing indicators
- Message history with timestamps

## Supported Query Types

### High Priority (Auto-Escalation)
- Fraud reports
- Legal matters
- Emergency situations
- Service complaints
- Account blocking

### Medium Priority
- KYC status inquiries
- Transaction issues
- Card problems
- Loan queries

### Standard Priority
- Balance inquiries
- Account information
- Net banking help
- Mobile app issues
- Branch information

## Escalation Criteria

The system automatically escalates when:
- Fraud/security keywords detected
- Legal terms mentioned
- User expresses extreme dissatisfaction
- Complex or lengthy queries
- Emergency situations

## Production Deployment

For production use:

1. **Set Environment Variables**
```env
DEMO_MODE=false
GOOGLE_TRANSLATE_API_KEY=your_api_key_here
```

2. **Install Production Dependencies**
```bash
npm install --production
```

3. **Use Process Manager**
```bash
npm install -g pm2
pm2 start server.js --name "support-agent"
```

4. **Configure Reverse Proxy**
Use Nginx or Apache to handle SSL and load balancing

## API Endpoints

### Main Chat Endpoint
```
POST /api/chat
Content-Type: application/json

{
  "message": "What is my KYC status?",
  "language": "hi"
}
```

### Language Detection
```
POST /api/detect-language
Content-Type: application/json

{
  "text": "Mera KYC status kya hai?"
}
```

### Supported Languages
```
GET /api/languages
```

## Testing

### Manual Testing
1. Start the application
2. Open browser to localhost:5000
3. Select different languages
4. Try demo queries
5. Test escalation scenarios

### Automated Testing
```bash
# Run demo script
node demo.js
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Change PORT in .env file
   - Kill process on port 5000

2. **Language detection not working**
   - Check DEMO_MODE=true in .env
   - Verify input contains regional language characters

3. **Translation not working**
   - Ensure DEMO_MODE=true for mock translations
   - Add GOOGLE_TRANSLATE_API_KEY for production

4. **Frontend not loading**
   - Check that client/index.html exists
   - Verify server is running on correct port

### Getting Help
- Check the console logs for errors
- Verify all files are in correct locations
- Ensure Node.js and npm are properly installed

## Next Steps

1. **Customize Responses** - Modify response templates in `src/responseGenerator.js`
2. **Add New Intents** - Update intent patterns in `src/intentRecognition.js`
3. **Integrate Real APIs** - Connect to actual banking systems
4. **Add Database** - Store conversation history and user data
5. **Deploy to Cloud** - Use AWS, Google Cloud, or Azure

---

**Note**: This demo uses mock translation and responses. For production, integrate with real translation APIs and banking systems.
