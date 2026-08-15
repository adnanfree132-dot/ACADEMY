const { chromium } = require('playwright');

async function testFullE2E() {
  console.log('🚀 Starting Comprehensive End-to-End UI/UX & Backend Integration Audit...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    consoleLogs.push(`[pageerror] ${err.message}`);
  });

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  console.log('✅ App loaded successfully.');

  // If on login page, authenticate
  if (await page.locator('button[type="submit"]').filter({ hasText: 'Sign In' }).isVisible()) {
    console.log('🔑 Performing initial Admin Sign In...');
    await page.locator('button[type="submit"]').filter({ hasText: 'Sign In' }).click();
    await page.waitForTimeout(1200);
  }

  const extractNumber = async (locator) => {
    const text = await locator.innerText();
    return parseInt(text.replace(/[^0-9]/g, '')) || 0;
  };

  try {
    console.log('🔍 Checking initial Dashboard stats (Backend Connection test)...');
    await page.waitForTimeout(1000); 
    
    const studentCountLocator = page.locator('.stat-label', { hasText: 'Enrolled Students' }).locator('..').locator('.stat-number');
    const initialStudents = await extractNumber(studentCountLocator);
    
    const teacherCountLocator = page.locator('.stat-label', { hasText: 'Faculty Members' }).locator('..').locator('.stat-number');
    const initialTeachers = await extractNumber(teacherCountLocator);
    
    const collectedAmountLocator = page.locator('.collections-main-stat .big-amount');
    const initialCollected = await extractNumber(collectedAmountLocator);

    console.log(`   Initial State -> Students: ${initialStudents}, Teachers: ${initialTeachers}, Collected: $${initialCollected}`);

    console.log('🔍 Testing "Add Teacher" full flow (UI -> API -> DB)...');
    await page.locator('.btn-primary').filter({ hasText: 'Create' }).first().click();
    await page.waitForTimeout(300);
    
    await page.locator('.modal-tab-btn').filter({ hasText: 'Add Teacher' }).click();
    await page.waitForTimeout(200);
    
    const ts = Date.now();
    const testTeacherName = `Test Teacher ${ts}`;
    await page.fill('input[placeholder="e.g. Asad Ullah"]', testTeacherName);
    await page.fill('input[placeholder="e.g. asad@academy.com"]', `teacher${ts}@test.com`);
    await page.fill('input[placeholder="+92 300 1234567"]', `+92300${String(ts).slice(-7)}`);
    await page.fill('input[placeholder="e.g. M.Sc Physics"]', 'Ph.D Math');
    
    await page.locator('button[type="submit"]').filter({ hasText: 'Add Teacher' }).click();
    await page.waitForTimeout(1000); 
    console.log('   ✓ Teacher submitted successfully.');

    console.log('🔍 Testing "Register Student" full flow (UI -> API -> DB)...');
    await page.locator('.btn-primary').filter({ hasText: 'Create' }).first().click();
    await page.waitForTimeout(300);
    
    await page.locator('.modal-tab-btn').filter({ hasText: 'Register Student' }).click();
    await page.waitForTimeout(200);
    
    const testStudentName = `Test Student ${ts}`;
    await page.fill('input[placeholder="e.g. Muhammad Hamza"]', testStudentName);
    await page.fill('input[placeholder="e.g. Tariq Mehmood"]', 'Test Parent');
    await page.fill('input[placeholder="+92 300 1234567"]', `+92301${String(ts).slice(-7)}`);
    
    await page.locator('button[type="submit"]').filter({ hasText: 'Complete Registration' }).click();
    await page.waitForTimeout(1000); 
    console.log('   ✓ Student registered successfully.');

    console.log('🔍 Testing "Record Fee Payment" full flow (UI -> API -> DB)...');
    await page.locator('.btn-primary').filter({ hasText: 'Create' }).first().click();
    await page.waitForTimeout(300);
    
    await page.locator('.modal-tab-btn').filter({ hasText: 'Record Fee Payment' }).click();
    await page.waitForTimeout(200);
    
    await page.fill('input[type="number"]', '500'); 
    await page.fill('input[placeholder="e.g. August 2026 Tuition Fee Payment"]', 'Playwright Test Payment');
    
    await page.locator('button[type="submit"]').filter({ hasText: 'Record Fee Payment' }).click();
    await page.waitForTimeout(1500); 
    console.log('   ✓ Fee payment recorded successfully.');

    console.log('🔍 Verifying Dashboard Stats reflect the backend changes...');
    await page.locator('.sidebar-item').filter({ hasText: 'Dashboard' }).click();
    await page.waitForTimeout(1000); 

    const newStudents = await extractNumber(studentCountLocator);
    const newTeachers = await extractNumber(teacherCountLocator);
    const newCollected = await extractNumber(collectedAmountLocator);
    
    console.log(`   Updated State -> Students: ${newStudents}, Teachers: ${newTeachers}, Collected: $${newCollected}`);
    
    if (newStudents <= initialStudents) throw new Error(`Student count did not increase! (Was ${initialStudents}, now ${newStudents})`);
    if (newTeachers <= initialTeachers) throw new Error(`Teacher count did not increase! (Was ${initialTeachers}, now ${newTeachers})`);
    if (newCollected < initialCollected + 500) throw new Error(`Fee Collection did not increase correctly! (Was ${initialCollected}, now ${newCollected})`);
    
    console.log('   ✓ Dashboard Stats updated successfully from backend DB!');

    console.log('🔍 Verifying Teacher appears in "Teachers & Staff" view...');
    await page.locator('.sidebar-item').filter({ hasText: 'Teachers & Staff' }).click();
    await page.waitForTimeout(500);
    
    const teacherExists = await page.locator(`text=${testTeacherName}`).isVisible();
    if (!teacherExists) throw new Error(`Teacher ${testTeacherName} not found in UI list!`);
    console.log('   ✓ Teacher verified in UI list.');

    console.log('🔍 Verifying Student appears in "Students" view...');
    await page.locator('.sidebar-item').filter({ hasText: 'Students' }).click();
    await page.waitForTimeout(500);
    
    const studentExists = await page.locator(`text=${testStudentName}`).isVisible();
    if (!studentExists) throw new Error(`Student ${testStudentName} not found in UI list!`);
    console.log('   ✓ Student verified in UI list.');

    console.log('\n======================================================');
    console.log('🏆 FULL END-TO-END AUDIT PASSED!');
    console.log('======================================================');
    console.log('UI forms correctly trigger React state -> Sends real requests to Express API -> Express persists to Prisma SQLite -> Frontend fetches updated state dynamically!');
    
  } catch (err) {
    console.error('\n❌ E2E TEST FAILED:', err.message);
    console.log('\n--- BROWSER CONSOLE LOGS ---');
    console.log(consoleLogs.join('\n'));
    process.exit(1);
  }

  await browser.close();
}

testFullE2E();
