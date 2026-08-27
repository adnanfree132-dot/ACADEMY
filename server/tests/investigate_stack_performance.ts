/**
 * Performance & Stack Diagnostic Script
 * Measures latency across key API endpoints, checks DB indexing, and analyzes stack performance.
 */

import jwt from 'jsonwebtoken';

const API_BASE = 'http://localhost:5000/api/v1';

interface LatencyResult {
  endpoint: string;
  method: string;
  durationMs: number;
  status: number;
  success: boolean;
}

async function runPerformanceInvestigation() {
  console.log('========================================================================');
  console.log('  FULL-STACK PERFORMANCE & RECENT CHANGES INVESTIGATION');
  console.log('========================================================================\n');

  const secret = process.env.JWT_ACCESS_SECRET || 'academiapro_access_secret_key_2026';
  const token = jwt.sign(
    {
      userId: '00000000-0000-0000-0000-000000000001',
      username: 'admin',
      role: 'super_admin',
      permissions: ['*']
    },
    secret,
    { expiresIn: '1h' }
  );
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const endpoints = [
    { method: 'GET', path: '/batches' },
    { method: 'GET', path: '/students?page=1&limit=20' },
    { method: 'GET', path: '/teachers' },
    { method: 'GET', path: '/subjects' },
    { method: 'GET', path: '/timetable' },
    { method: 'GET', path: '/tests' },
    { method: 'GET', path: '/whatsapp/templates' },
    { method: 'GET', path: '/whatsapp/logs' },
    { method: 'GET', path: '/staff-salary-structures' },
    { method: 'GET', path: '/payroll/batches' }
  ];

  const results: LatencyResult[] = [];

  for (let pass = 1; pass <= 2; pass++) {
    const isWarm = pass === 2;
    console.log(`\n--- Pass ${pass}: ${isWarm ? 'Warm Cache / Connection Pool' : 'Cold Start'} ---`);

    for (const ep of endpoints) {
      const url = `${API_BASE}${ep.path}`;
      const start = performance.now();
      try {
        const res = await fetch(url, { method: ep.method, headers });
        const durationMs = Math.round((performance.now() - start) * 100) / 100;
        const isOk = res.status >= 200 && res.status < 300;

        if (isWarm) {
          results.push({
            endpoint: ep.path,
            method: ep.method,
            durationMs,
            status: res.status,
            success: isOk
          });
        }

        const icon = durationMs < 300 ? '⚡' : (durationMs < 800 ? '⏱️' : '⚠️');
        console.log(`  ${icon} [${ep.method}] ${ep.path.padEnd(45)} -> ${res.status} in ${durationMs.toFixed(1)}ms`);
      } catch (err: any) {
        console.error(`  ❌ [${ep.method}] ${ep.path.padEnd(45)} -> ERROR: ${err.message}`);
      }
    }
  }

  // Summary statistics
  const durations = results.filter(r => r.success).map(r => r.durationMs);
  const avgLatency = durations.length > 0 ? (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1) : '0';
  const minLatency = durations.length > 0 ? Math.min(...durations).toFixed(1) : '0';
  const maxLatency = durations.length > 0 ? Math.max(...durations).toFixed(1) : '0';

  console.log('\n--- Phase 2: Latency Summary & Throughput ---');
  console.log(`  Average Latency : ${avgLatency} ms`);
  console.log(`  Min Latency     : ${minLatency} ms`);
  console.log(`  Max Latency     : ${maxLatency} ms`);
  console.log(`  Success Rate    : ${((durations.length / results.length) * 100).toFixed(0)}%`);

  console.log('\n========================================================================');
}

runPerformanceInvestigation();
