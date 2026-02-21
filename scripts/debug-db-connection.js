/**
 * Backend environment validation script
 * Run: node scripts/debug-db-connection.js
 */
const { Client } = require('pg');
const config = require('../config/config.json');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '..', '.env');
let envVars = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const eq = line.indexOf('=');
    if (eq > 0) {
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      envVars[key] = val;
    }
  });
}

async function run() {
  console.log('=== Backend Environment Validation ===\n');

  // 1. .env validation
  console.log('1. .ENV CONFIGURATION');
  console.log('   DATABASE_URL:', envVars.DATABASE_URL ? '(set)' : '(not set)');
  console.log('   VITE_API_URL:', envVars.VITE_API_URL || '(not set)');
  console.log('   PORT:', envVars.PORT || '(not set, defaults to 3000)');
  console.log('');

  // 2. config.json vs credentials
  const dev = config.development;
  console.log('2. CONFIG.JSON (development)');
  console.log('   host:', dev.host);
  console.log('   database:', dev.database);
  console.log('   username:', dev.username);
  console.log('   password:', dev.password ? '***' + dev.password.slice(-2) : '(empty)');
  console.log('');

  // 3. Test DB connection
  console.log('3. DATABASE CONNECTION TEST');
  const pgConfig = {
    host: dev.host || '127.0.0.1',
    port: 5432,
    user: dev.username,
    password: dev.password,
    database: 'postgres'
  };

  const client = new Client(pgConfig);
  try {
    await client.connect();
    console.log('   [OK] Connected to PostgreSQL server');
  } catch (err) {
    console.log('   [FAIL]', err.message);
    if (err.message && err.message.includes('password authentication failed')) {
      console.log('\n   >>> ROOT CAUSE: Wrong PostgreSQL password in config/config.json');
      console.log('   >>> Fix: Update config.json with your current PostgreSQL password');
    }
    process.exit(1);
  }

  // 4. Check if database exists
  const { rows: dbRows } = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [dev.database]
  );
  if (dbRows.length === 0) {
    console.log('   [FAIL] Database "' + dev.database + '" does not exist');
    console.log('   >>> Fix: Run "node scripts/create-db.js"');
  } else {
    console.log('   [OK] Database "' + dev.database + '" exists');
  }

  // 5. Connect to app database and check tables
  await client.end();
  const appClient = new Client({
    ...pgConfig,
    database: dev.database
  });

  try {
    await appClient.connect();
  } catch (err) {
    console.log('   [FAIL] Cannot connect to', dev.database, ':', err.message);
    process.exit(1);
  }

  const { rows: tableRows } = await appClient.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  console.log('\n4. TABLES IN DATABASE');
  const tables = tableRows.map(r => r.table_name);
  if (tables.length === 0) {
    console.log('   [FAIL] No tables found. Run migrations or setup-auth-database.js');
  } else {
    tables.forEach(t => console.log('   -', t));
  }

  const hasBuyers = tables.includes('buyers');
  const hasSellers = tables.includes('sellers');
  if (!hasBuyers || !hasSellers) {
    console.log('\n   >>> ROOT CAUSE: buyers/sellers tables missing');
    console.log('   >>> Fix: Run "node setup-auth-database.js"');
  } else {
    const { rows: buyerCount } = await appClient.query('SELECT COUNT(*) as c FROM buyers');
    const { rows: sellerCount } = await appClient.query('SELECT COUNT(*) as c FROM sellers');
    console.log('\n   [OK] buyers:', buyerCount[0].c, 'rows, sellers:', sellerCount[0].c, 'rows');
  }

  await appClient.end();

  // 6. Port check
  console.log('\n5. PORT USAGE');
  const net = require('net');
  const checkPort = (port) => new Promise(res => {
    const s = net.createServer();
    s.once('error', () => res(true)); // in use
    s.once('listening', () => { s.close(); res(false); });
    s.listen(port, '127.0.0.1');
  });
  const portInUse = await checkPort(Number(envVars.PORT) || 3000);
  console.log('   Port 3000:', portInUse ? '(in use)' : '(free)');

  console.log('\n=== Validation complete ===\n');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
