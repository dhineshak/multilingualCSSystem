require('dotenv').config();
const readline = require('readline');
const { initializeDatabase, executeQuery, closeConnection } = require('./src/database');
const aiService = require('./src/aiService');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

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

async function generateAIResponse(investorData, userQuery = '') {
  try {
    const intent = 'investor_details_query';
    const language = 'en'; // Default to English, can be made configurable
    
    // Format investor data for context
    const dataContext = {
      investorData: investorData,
      queryType: 'pan_based_lookup'
    };
    
    // Build a descriptive message about the data found
    let message = `User queried for PAN: ${userQuery || 'N/A'}\n\n`;
    
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
    
    const context = {
      ...dataContext,
      englishMessage: message
    };
    
    const aiResponse = await aiService.generateResponse(intent, message, language, context);
    return aiResponse;
  } catch (error) {
    console.error('Error generating AI response:', error);
    return 'I apologize, but I encountered an error while processing your request. Please try again later.';
  }
}

async function main() {
  try {
    console.log('=== Investor Details Query System ===');
    console.log('This system retrieves investor details based on PAN number and provides AI-powered responses.\n');
    
    // Initialize database connection
    console.log('Initializing database connection...');
    await initializeDatabase();
    console.log('Database connected successfully!\n');
    
    while (true) {
      try {
        // Get PAN number from user
        const panNumber = await askQuestion('Enter PAN number (or "exit" to quit): ');
        
        if (panNumber.toLowerCase() === 'exit') {
          break;
        }
        
        // Basic PAN validation (format: ABCDE1234F)
        if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(panNumber)) {
          console.log('Invalid PAN format. Please enter a valid PAN number (e.g., ABCDE1234F).\n');
          continue;
        }
        
        console.log(`\nQuerying database for PAN: ${panNumber.toUpperCase()}...`);
        
        // Query the database
        const investorData = await queryInvestorByPan(panNumber);
        
        console.log('\n=== Database Query Results ===');
        if (investorData && investorData.length > 0) {
          console.log(`Found ${investorData.length} record(s):`);
          console.log(JSON.stringify(investorData, null, 2));
        } else {
          console.log('No records found for this PAN number.');
        }
        
        // Generate AI response
        console.log('\n=== AI-Generated Response ===');
        const aiResponse = await generateAIResponse(investorData, panNumber);
        console.log(aiResponse);
        
        console.log('\n' + '='.repeat(50) + '\n');
        
      } catch (error) {
        console.error('Error processing request:', error.message);
        console.log('Please try again.\n');
      }
    }
    
    console.log('Thank you for using the Investor Details Query System!');
    
  } catch (error) {
    console.error('System initialization error:', error);
  } finally {
    // Close database connection
    try {
      await closeConnection();
      rl.close();
    } catch (error) {
      console.error('Error closing connections:', error);
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\nShutting down gracefully...');
  closeConnection().then(() => {
    rl.close();
    process.exit(0);
  });
});

// Run the main function
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  queryInvestorByPan,
  generateAIResponse
};
