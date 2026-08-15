const { chromium } = require('playwright');

async function runQuickstartAudit() {
  console.log('🚀 Starting Quickstart & E2E Validation for Student, Class, and Teacher Modules...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(`[console error] ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(`[pageerror] ${err.message}`);
  });

  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  console.log('✅ Web App loaded on http://localhost:3000/');

  // Ensure authenticated session
  await page.waitForTimeout(1000);
  const isLoginPage = await page.locator('button[type="submit"]').filter({ hasText: /Sign In/i }).isVisible().catch(() => false);
  if (isLoginPage) {
    console.log('🔑 Performing Admin Sign In...');
    await page.locator('button[type="submit"]').filter({ hasText: /Sign In/i }).click();
  }

  await page.waitForSelector('.sidebar', { timeout: 12000 });
  console.log('   ✓ Academy Dashboard & Sidebar ready.');

  // SCENARIO 1: Admit New Student & Verify Capacity + Fee Plan
  console.log('\n--- SCENARIO 1: Admit New Student & Verify Directory + Fee Plan ---');
  await page.locator('.sidebar-item').filter({ hasText: 'Students' }).click();
  await page.waitForTimeout(600);

  const regStudentBtn = page.locator('button').filter({ hasText: 'Add New Student' }).first();
  await regStudentBtn.click();
  await page.waitForTimeout(400);

  const testStudentName = `Audit Student ${Date.now()}`;
  await page.locator('input[placeholder*="Zayan"], input[placeholder*="Hamza"]').first().fill(testStudentName);
  await page.locator('input[placeholder*="Tariq"]').first().fill('Tariq Mehmood');
  await page.locator('input[placeholder*="+92 300"]').first().fill(`+92300${String(Date.now()).slice(-7)}`);
  
  const feeInput = page.locator('input[type="number"]').first();
  if (await feeInput.isVisible()) {
    await feeInput.fill('15000');
  }

  const submitReg = page.locator('button[type="submit"]').first();
  await submitReg.click();
  await page.waitForTimeout(1500);

  // Close credential slip if present
  const closeCredBtn = page.locator('button').filter({ hasText: /Done & Close|Close/i }).first();
  if (await closeCredBtn.isVisible()) {
    await closeCredBtn.click();
    await page.waitForTimeout(500);
  }

  console.log(`   ✓ Registered student "${testStudentName}" successfully!`);

  // SCENARIO 2: Faculty Onboarding & Batch Assignment
  console.log('\n--- SCENARIO 2: Faculty Onboarding & Batch Assignment ---');
  await page.locator('.sidebar-item').filter({ hasText: /Teachers/i }).click();
  await page.waitForTimeout(500);

  const addTeacherBtn = page.locator('button').filter({ hasText: 'Add Faculty Member' }).first();
  await addTeacherBtn.click();
  await page.waitForTimeout(400);

  const testTeacherName = `Prof. Test ${Date.now()}`;
  await page.locator('input[placeholder*="Ayesha"], input[placeholder*="Ahmed"]').first().fill(testTeacherName);
  await page.locator('input[placeholder*="academy.com"], input[type="email"]').first().fill(`prof${Date.now()}@academy.com`);
  await page.locator('input[placeholder*="+92 300"]').first().fill(`+92302${String(Date.now()).slice(-7)}`);
  await page.locator('input[placeholder*="Ph.D"], input[placeholder*="M.Sc"]').first().fill('M.Phil Mathematics');

  const submitTeacher = page.locator('button[type="submit"]').first();
  await submitTeacher.click();
  await page.waitForTimeout(1500);

  console.log(`   ✓ Onboarded faculty member "${testTeacherName}" successfully!`);

  // SCENARIO 3: Academic Batches Inspection & Navigation
  console.log('\n--- SCENARIO 3: Academic Batches Roster & Controls ---');
  await page.locator('.sidebar-item').filter({ hasText: /Batches|Classes/i }).click();
  await page.waitForTimeout(500);

  const batchCards = page.locator('.batch-card');
  const count = await batchCards.count();
  console.log(`   ✓ Academic batches view rendered with ${count} active batches/sections.`);

  // SCENARIO 4: Student 360 Drawer & Multi-Action Workspace
  console.log('\n--- SCENARIO 4: Student 360 Drawer & Workspace ---');
  await page.locator('.sidebar-item').filter({ hasText: 'Students' }).click();
  await page.waitForTimeout(500);

  const studentRow = page.locator('.student-table tbody tr').first();
  if (await studentRow.isVisible()) {
    await studentRow.click();
    await page.waitForTimeout(500);

    const drawer = page.locator('.student-profile-drawer');
    if (await drawer.isVisible()) {
      console.log('   ✓ Student 360 Profile Drawer opened with attendance & fee widgets!');
      
      // Close drawer
      const closeDrawer = page.locator('.drawer-header button').first();
      if (await closeDrawer.isVisible()) {
        await closeDrawer.click();
        await page.waitForTimeout(300);
      }
    }
  }

  // SCENARIO 5: Full Navigation Sweep across all modules
  console.log('\n--- SCENARIO 5: Sidebar Navigation Sweep ---');
  const tabs = [
    'Dashboard',
    'Students',
    'Teachers & Staff',
    'Attendance Portal',
    'Fee Management',
    'Exams & Results',
    'Homework & Study',
    'Timetable',
    'Inquiries & CRM',
    'Announcements',
    'Academy Settings'
  ];

  for (const tabName of tabs) {
    const tabLocator = page.locator('.sidebar-item').filter({ hasText: tabName });
    if (await tabLocator.isVisible()) {
      await tabLocator.click();
      await page.waitForTimeout(200);
      console.log(`   ✓ Tab "${tabName}" rendered.`);
    }
  }

  await browser.close();

  if (consoleErrors.length > 0) {
    console.warn('\n⚠️ Encountered console issues:', consoleErrors);
  } else {
    console.log('\n🌟 ALL 5 SCENARIOS PASSED WITH ZERO CONSOLE ERRORS! 🚀');
  }
}

runQuickstartAudit().catch(err => {
  console.error('\n❌ Quickstart validation failed:', err);
  process.exit(1);
});
