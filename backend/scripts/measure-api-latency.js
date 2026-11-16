'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const autocannon = require('autocannon');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'scrowx_super_secret_jwt_key_2026';

function waitForPort(port, timeoutMs = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function tryConnect() {
      const socket = require('net').createConnection(port, 'localhost');
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.on('error', () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Timeout waiting for port ${port}`));
        } else {
          setTimeout(tryConnect, 300);
        }
      });
    }
    tryConnect();
  });
}

function httpGet(url, token) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: data });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runBenchmark() {
  console.log('=== SCROWX API LATENCY BENCHMARK (autocannon -c 5 -d 10) ===\n');

  // 1. Get a buyer to generate JWT
  const buyer = await prisma.buyer.findFirst();
  if (!buyer) {
    throw new Error('No buyer found in database to generate JWT token.');
  }

  const token = jwt.sign(
    { id: buyer.id, role: 'buyer', email: buyer.email },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  console.log(`Generated JWT for Buyer: ${buyer.email} (${buyer.id})`);

  // 2. Check if server is running or start it
  let serverProcess = null;
  let port = 3000;

  try {
    await waitForPort(port, 1000);
    console.log(`Server already running on port ${port}.`);
  } catch {
    console.log(`Starting server on port ${port}...`);
    serverProcess = spawn('node', ['server.js'], {
      cwd: path.resolve(__dirname, '../..'),
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, PORT: '3000' }
    });

    serverProcess.stdout.on('data', d => {
      const msg = d.toString();
      if (msg.includes('Server running') || msg.includes('started')) {
        // logged
      }
    });

    serverProcess.stderr.on('data', d => {
      // ignore or log
    });

    await waitForPort(port, 20000);
    console.log(`Server started successfully on port ${port}.`);
  }

  // 3. Smoke test endpoints before benchmarking
  console.log('\n--- Pre-flight Smoke Tests ---');
  const t1 = await httpGet(`http://localhost:${port}/api/wallet/summary`, token);
  console.log(`GET /api/wallet/summary -> HTTP ${t1.statusCode} (${t1.body.slice(0, 80)}...)`);
  if (t1.statusCode !== 200) {
    throw new Error(`Smoke test failed for /api/wallet/summary: ${t1.body}`);
  }

  const t2 = await httpGet(`http://localhost:${port}/api/disputes/stats/overview`, token);
  console.log(`GET /api/disputes/stats/overview -> HTTP ${t2.statusCode} (${t2.body.slice(0, 80)}...)`);
  if (t2.statusCode !== 200) {
    throw new Error(`Smoke test failed for /api/disputes/stats/overview: ${t2.body}`);
  }

  const endpoints = [
    { name: 'GET /api/wallet/summary', url: `http://localhost:${port}/api/wallet/summary` },
    { name: 'GET /api/disputes/stats/overview', url: `http://localhost:${port}/api/disputes/stats/overview` }
  ];

  const results = [];

  for (const ep of endpoints) {
    console.log(`\nBenchmarking ${ep.name} with 5 connections for 10 seconds...`);
    const result = await autocannon({
      url: ep.url,
      connections: 5,
      duration: 10,
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    const p95Val = result.latency.p95 !== undefined ? result.latency.p95 : (result.latency.p97_5 !== undefined ? result.latency.p97_5 : result.latency.p90);
    results.push({
      endpoint: ep.name,
      requestsTotal: result.requests.total,
      requestsPerSec: result.requests.average,
      latencyAvgMs: result.latency.average,
      latencyP50Ms: result.latency.p50,
      latencyP90Ms: result.latency.p90,
      latencyP95Ms: p95Val,
      latencyMinMs: result.latency.min,
      latencyMaxMs: result.latency.max,
      errors: result.errors,
      timeouts: result.timeouts,
      non2xx: result.non2xx
    });
  }

  console.log('\n' + '='.repeat(105));
  console.log('RAW MEASURED OUTPUT: API LATENCY BENCHMARK RESULTS (autocannon -c 5 -d 10)');
  console.log('='.repeat(105));
  console.log(
    'Endpoint'.padEnd(35) +
    'Req/s'.padStart(10) +
    'Avg (ms)'.padStart(11) +
    'p50 (ms)'.padStart(11) +
    'p90 (ms)'.padStart(11) +
    'p95/97.5 (ms)'.padStart(15) +
    'Min (ms)'.padStart(11) +
    'Errors'.padStart(8)
  );
  console.log('-'.repeat(105));

  for (const r of results) {
    console.log(
      r.endpoint.padEnd(35) +
      (r.requestsPerSec || 0).toFixed(1).padStart(10) +
      (r.latencyAvgMs || 0).toFixed(2).padStart(11) +
      (r.latencyP50Ms || 0).toFixed(2).padStart(11) +
      (r.latencyP90Ms || 0).toFixed(2).padStart(11) +
      (r.latencyP95Ms || 0).toFixed(2).padStart(15) +
      (r.latencyMinMs || 0).toFixed(2).padStart(11) +
      (r.errors + r.non2xx).toString().padStart(8)
    );
  }
  console.log('='.repeat(105));

  if (serverProcess) {
    console.log('\nStopping server process...');
    serverProcess.kill('SIGTERM');
  }

  await prisma.$disconnect();
}

runBenchmark().catch(async err => {
  console.error('Benchmark failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
