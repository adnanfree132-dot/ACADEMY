/**
 * Automated Live Production Multi-Role Verification Script
 * Milestone 5 (R5)
 *
 * Tests:
 * - Direct Cloudflare Worker API: https://academy-api.adnanfree132.workers.dev
 * - Cloudflare Pages Domain: https://edu.toolnestr.com
 *
 * Validates:
 * 1. Health checks on both endpoints.
 * 2. POST /api/v1/auth/login for all 4 canonical roles:
 *    - super_admin: superadmin@academiapro.io / superadmin123
 *    - admin: admin / admin
 *    - teacher: teacher@academiapro.edu / teacher123
 *    - student: demo.student@academiapro.edu / student123
 * 3. GET /api/v1/auth/me with Bearer token for all 4 roles.
 * 4. GET /api/v1/dashboard for admin and teacher roles.
 * 5. Role-specific resource queries (student invoices, super_admin stats).
 * 6. Zero error banners containing "warming up".
 */

const TARGETS = [
  { name: 'Direct Worker API', baseUrl: 'https://academy-api.adnanfree132.workers.dev' },
  { name: 'Production Pages', baseUrl: 'https://edu.toolnestr.com' }
];

const CREDENTIALS = [
  {
    roleName: 'super_admin',
    emailOrUsername: 'superadmin@academiapro.io',
    password: 'superadmin123',
    expectedRole: 'super_admin'
  },
  {
    roleName: 'admin',
    emailOrUsername: 'admin',
    password: 'admin',
    expectedRole: 'admin'
  },
  {
    roleName: 'teacher',
    emailOrUsername: 'teacher@academiapro.edu',
    password: 'teacher123',
    expectedRole: 'faculty' // In database, teacher role is stored as 'faculty'
  },
  {
    roleName: 'student',
    emailOrUsername: 'demo.student@academiapro.edu',
    password: 'student123',
    expectedRole: 'student'
  }
];

const results = [];

async function request(url, options = {}) {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    const duration = Date.now() - start;
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    return {
      status: res.status,
      ok: res.ok,
      headers: Object.fromEntries(res.headers.entries()),
      duration,
      text,
      json
    };
  } catch (err) {
    const duration = Date.now() - start;
    return {
      status: 0,
      ok: false,
      headers: {},
      duration,
      text: err.message,
      json: null,
      error: err.message
    };
  }
}

function assertNoWarmingUp(targetName, endpoint, text) {
  if (typeof text === 'string' && text.toLowerCase().includes('warming up')) {
    throw new Error(`[FAIL] Found forbidden "warming up" error banner in ${targetName} ${endpoint}`);
  }
}

async function runVerification() {
  console.log('='.repeat(80));
  console.log('🚀 Starting Automated Live Production Multi-Role Verification');
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log('='.repeat(80));

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const target of TARGETS) {
    console.log(`\n🌐 Testing Target: ${target.name} (${target.baseUrl})`);
    console.log('-'.repeat(80));

    // 1. Health check
    totalTests++;
    const healthUrl = `${target.baseUrl}/api/v1/health`;
    const healthRes = await request(healthUrl);
    assertNoWarmingUp(target.name, '/api/v1/health', healthRes.text);

    if (healthRes.status === 200) {
      passedTests++;
      console.log(`  ✅ [${healthRes.duration}ms] GET /api/v1/health -> HTTP 200 (status: ${healthRes.json?.status})`);
      results.push({ target: target.name, test: 'Health Check', status: 200, duration: healthRes.duration, pass: true });
    } else {
      failedTests++;
      console.log(`  ❌ [${healthRes.duration}ms] GET /api/v1/health -> HTTP ${healthRes.status}: ${healthRes.text}`);
      results.push({ target: target.name, test: 'Health Check', status: healthRes.status, duration: healthRes.duration, pass: false, error: healthRes.text });
    }

    // 2. Test each role
    for (const cred of CREDENTIALS) {
      console.log(`\n  👤 Role: ${cred.roleName} (${cred.emailOrUsername})`);

      // 2a. POST /api/v1/auth/login
      totalTests++;
      const loginUrl = `${target.baseUrl}/api/v1/auth/login`;
      const loginBody = JSON.stringify({
        identifier: cred.emailOrUsername,
        email: cred.emailOrUsername,
        username: cred.emailOrUsername,
        password: cred.password
      });

      const loginRes = await request(loginUrl, {
        method: 'POST',
        body: loginBody
      });
      assertNoWarmingUp(target.name, `/auth/login [${cred.roleName}]`, loginRes.text);

      const token = loginRes.json?.token || loginRes.json?.data?.token;
      const returnedUser = loginRes.json?.user || loginRes.json?.data?.user;

      if (loginRes.status === 200 && token) {
        passedTests++;
        console.log(`    ✅ [${loginRes.duration}ms] POST /api/v1/auth/login -> HTTP 200 (Token obtained, length: ${token.length})`);
        results.push({
          target: target.name,
          test: `Login [${cred.roleName}]`,
          status: 200,
          duration: loginRes.duration,
          pass: true
        });
      } else {
        failedTests++;
        console.log(`    ❌ [${loginRes.duration}ms] POST /api/v1/auth/login -> HTTP ${loginRes.status}: ${loginRes.text}`);
        results.push({
          target: target.name,
          test: `Login [${cred.roleName}]`,
          status: loginRes.status,
          duration: loginRes.duration,
          pass: false,
          error: loginRes.text
        });
        continue;
      }

      // 2b. GET /api/v1/auth/me with Bearer token
      totalTests++;
      const meUrl = `${target.baseUrl}/api/v1/auth/me`;
      const meRes = await request(meUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      assertNoWarmingUp(target.name, `/auth/me [${cred.roleName}]`, meRes.text);

      const authMeUser = meRes.json?.user || meRes.json?.data?.user || meRes.json?.data;
      const actualRole = authMeUser?.role;
      const roleMatches = actualRole === cred.expectedRole || actualRole === cred.roleName;

      if (meRes.status === 200 && roleMatches) {
        passedTests++;
        console.log(`    ✅ [${meRes.duration}ms] GET /api/v1/auth/me -> HTTP 200 (User: ${authMeUser?.name || authMeUser?.email}, Role: ${actualRole})`);
        results.push({
          target: target.name,
          test: `Auth Me [${cred.roleName}]`,
          status: 200,
          duration: meRes.duration,
          pass: true,
          role: actualRole
        });
      } else {
        failedTests++;
        console.log(`    ❌ [${meRes.duration}ms] GET /api/v1/auth/me -> HTTP ${meRes.status} (Expected role: ${cred.expectedRole}, got: ${actualRole}): ${meRes.text}`);
        results.push({
          target: target.name,
          test: `Auth Me [${cred.roleName}]`,
          status: meRes.status,
          duration: meRes.duration,
          pass: false,
          error: `Role mismatch or error: ${meRes.text}`
        });
      }

      // 2c. Role-specific data verification
      if (cred.roleName === 'admin' || cred.roleName === 'teacher') {
        totalTests++;
        const dashUrl = `${target.baseUrl}/api/v1/dashboard`;
        const dashRes = await request(dashUrl, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        assertNoWarmingUp(target.name, `/dashboard [${cred.roleName}]`, dashRes.text);

        if (dashRes.status === 200) {
          passedTests++;
          const stats = dashRes.json?.stats || dashRes.json?.data?.stats;
          console.log(`    ✅ [${dashRes.duration}ms] GET /api/v1/dashboard -> HTTP 200 (Operational data retrieved)`);
          results.push({
            target: target.name,
            test: `Dashboard [${cred.roleName}]`,
            status: 200,
            duration: dashRes.duration,
            pass: true
          });
        } else {
          failedTests++;
          console.log(`    ❌ [${dashRes.duration}ms] GET /api/v1/dashboard -> HTTP ${dashRes.status}: ${dashRes.text}`);
          results.push({
            target: target.name,
            test: `Dashboard [${cred.roleName}]`,
            status: dashRes.status,
            duration: dashRes.duration,
            pass: false,
            error: dashRes.text
          });
        }
      } else if (cred.roleName === 'student') {
        totalTests++;
        const invoiceUrl = `${target.baseUrl}/api/v1/fees/invoices`;
        const invoiceRes = await request(invoiceUrl, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        assertNoWarmingUp(target.name, `/fees/invoices [student]`, invoiceRes.text);

        if (invoiceRes.status === 200) {
          passedTests++;
          console.log(`    ✅ [${invoiceRes.duration}ms] GET /api/v1/fees/invoices -> HTTP 200 (Student invoices retrieved)`);
          results.push({
            target: target.name,
            test: `Invoices [student]`,
            status: 200,
            duration: invoiceRes.duration,
            pass: true
          });
        } else {
          failedTests++;
          console.log(`    ❌ [${invoiceRes.duration}ms] GET /api/v1/fees/invoices -> HTTP ${invoiceRes.status}: ${invoiceRes.text}`);
          results.push({
            target: target.name,
            test: `Invoices [student]`,
            status: invoiceRes.status,
            duration: invoiceRes.duration,
            pass: false,
            error: invoiceRes.text
          });
        }
      } else if (cred.roleName === 'super_admin') {
        totalTests++;
        const statsUrl = `${target.baseUrl}/api/v1/super-admin/stats`;
        const statsRes = await request(statsUrl, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        assertNoWarmingUp(target.name, `/super-admin/stats [super_admin]`, statsRes.text);

        if (statsRes.status === 200) {
          passedTests++;
          console.log(`    ✅ [${statsRes.duration}ms] GET /api/v1/super-admin/stats -> HTTP 200 (Super Admin platform stats retrieved)`);
          results.push({
            target: target.name,
            test: `Platform Stats [super_admin]`,
            status: 200,
            duration: statsRes.duration,
            pass: true
          });
        } else {
          failedTests++;
          console.log(`    ❌ [${statsRes.duration}ms] GET /api/v1/super-admin/stats -> HTTP ${statsRes.status}: ${statsRes.text}`);
          results.push({
            target: target.name,
            test: `Platform Stats [super_admin]`,
            status: statsRes.status,
            duration: statsRes.duration,
            pass: false,
            error: statsRes.text
          });
        }
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`📊 FINAL RESULTS: ${passedTests}/${totalTests} Tests Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log(`   Failed: ${failedTests}`);
  console.log('='.repeat(80));

  if (failedTests > 0) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal Verification Error:', err);
  process.exit(1);
});
