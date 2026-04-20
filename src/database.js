const sql = require('mssql');

// Database configuration
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_SECRET,
  server: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME,
  options: {
    encrypt: false, // Set to false for local SQL Server
    trustServerCertificate: true, // For local development
    enableArithAbort: true,
    connectTimeout: 60000,
    requestTimeout: 60000
  },
  connectionTimeout: 60000,
  requestTimeout: 60000,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool = null;

// Initialize database connection pool
async function initializeDatabase() {
  try {
    pool = await sql.connect(config);
    console.log('Connected to MSSQL database successfully');
    return pool;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

// Get database connection pool
function getPool() {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return pool;
}

// Execute query with error handling
async function executeQuery(query, params = []) {
  try {
    const pool = getPool();
    const request = pool.request();
    
    // Add parameters if provided
    params.forEach((param, index) => {
      request.input(`param${index}`, param.value, param.type);
    });
    
    const result = await request.query(query);
    return result;
  } catch (error) {
    console.error('Query execution failed:', error);
    throw error;
  }
}

// Test database connection
async function testConnection() {
  try {
    const result = await executeQuery('SELECT @@VERSION as version, DB_NAME() as [database]');
    console.log('Database connection test successful');
    return result.recordset[0];
  } catch (error) {
    console.error('Database connection test failed:', error);
    throw error;
  }
}

// Close database connection
async function closeConnection() {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log('Database connection closed');
    }
  } catch (error) {
    console.error('Error closing database connection:', error);
    throw error;
  }
}

module.exports = {
  initializeDatabase,
  getPool,
  executeQuery,
  testConnection,
  closeConnection,
  sql
};
