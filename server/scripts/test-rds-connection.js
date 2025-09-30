require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  console.log('Testing MySQL connection with env:');
  const cfg = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT || 10000),
    ssl: ["1","true","TRUE"].includes(String(process.env.DB_SSL||"").trim())
      ? { rejectUnauthorized: !["0","false","FALSE"].includes(String(process.env.DB_SSL_REJECT_UNAUTHORIZED||"").trim()) }
      : undefined,
  };
  console.log({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    database: cfg.database,
    connectTimeout: cfg.connectTimeout,
    ssl: !!cfg.ssl,
  });
  try {
    const conn = await mysql.createConnection(cfg);
    const [rows] = await conn.query('SELECT 1 AS ok');
    console.log('Query result:', rows);
    await conn.end();
    console.log('Success: able to connect to RDS.');
    process.exit(0);
  } catch (err) {
    console.error('Connection failed:', err && {
      name: err.name,
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
      fatal: err.fatal,
      message: err.message,
    });
    process.exit(1);
  }
})();
