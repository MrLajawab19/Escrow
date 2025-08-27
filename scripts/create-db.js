const { Client } = require('pg');
const config = require('../config/config.json');

async function ensureDatabase() {
  const dbName = config.development.database;
  const user = config.development.username;
  const password = config.development.password;
  const host = config.development.host || '127.0.0.1';
  const port = 5432;

  // Connect to default 'postgres' database first
  const adminClient = new Client({
    host,
    port,
    user,
    password,
    database: 'postgres',
  });

  try {
    await adminClient.connect();
    const { rows } = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );
    if (rows.length === 0) {
      console.log(`Creating database ${dbName}...`);
      await adminClient.query(`CREATE DATABASE ${dbName}`);
      console.log('Database created.');
    } else {
      console.log(`Database ${dbName} already exists.`);
    }
  } catch (err) {
    console.error('Failed to ensure database exists:', err);
    process.exit(1);
  } finally {
    await adminClient.end();
  }
}

ensureDatabase();


