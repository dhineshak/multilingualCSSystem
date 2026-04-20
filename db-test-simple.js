require('dotenv').config();
const sql = require('mssql');

async function testConnection() {
  const config = {
    user: process.env.DB_USER,
    password: process.env.DB_SECRET,
    server: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 1433,
    database: process.env.DB_NAME,
    options: {
      encrypt: false,
      trustServerCertificate: true,
      enableArithAbort: true,
      connectTimeout: 60000,
      requestTimeout: 60000
    },
    connectionTimeout: 60000,
    requestTimeout: 60000
  };

  console.log('Testing database connection with config:');
  console.log(`Server: ${config.server}:${config.port}`);
  console.log(`Database: ${config.database}`);
  console.log(`User: ${config.user}`);
  console.log('----------------------------------------');

  try {
    const pool = await sql.connect(config);
    console.log('✓ Connection successful!');
    
    const result = await pool.request().query('SELECT @@VERSION as version, DB_NAME() as [database]');
    console.log(`✓ Database: ${result.recordset[0].database}`);
    console.log(`✓ Version: ${result.recordset[0].version.substring(0, 50)}...`);
    
    await pool.close();
    console.log('✓ Connection closed successfully');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.code === 'ETIMEOUT') {
      console.error('Timeout error - possible causes:');
      console.error('- Network connectivity issues');
      console.error('- Firewall blocking port 1433');
      console.error('- SQL Server not running or not accepting connections');
      console.error('- Incorrect server IP address');
    } else if (error.code === 'ELOGIN') {
      console.error('Login error - possible causes:');
      console.error('- Incorrect username or password');
      console.error('- User does not have access to the database');
    }
  }
}

testConnection();
