const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function auditMobile() {
  console.log('📱 Starting post-overhaul comprehensive mobile layout audit with Playwright...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true
  });
  
  const page = await context.newPage();

  // Set token directly in localStorage to bypass login
  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-jwt-token');
    localStorage.setItem('user', JSON.stringify({ id: 'admin-1', full_name: 'Admin User', role: 'admin' }));
  });

  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  const isLoginPage = await page.locator('button[type="submit"]').filter({ hasText: /Sign In/i }).isVisible().catch(() => false);
  if (isLoginPage) {
    console.log('Clicking Sign In button...');
    await page.locator('button[type="submit"]').filter({ hasText: /Sign In/i }).click();
    await page.waitForTimeout(2000);
  }

  await page.waitForSelector('.main-content, .mobile-top-bar', { timeout: 10000 });
  console.log('✅ Dashboard loaded successfully on mobile viewport!');

  const screenshotsDir = path.join(__dirname, 'mobile_audit_screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', bottomNavText: 'Dashboard' },
    { id: 'students', label: 'Students', bottomNavText: 'Students' },
    { id: 'batches', label: 'Batches / Classes', bottomNavText: 'Classes' },
    { id: 'fees', label: 'Fees', bottomNavText: 'Fees' },
    { id: 'teachers', label: 'Teachers & Staff', drawerText: 'Teachers & Staff' },
    { id: 'attendance', label: 'Attendance Portal', drawerText: 'Attendance Portal' },
    { id: 'subjects', label: 'Course Subjects', drawerText: 'Course Subjects' },
    { id: 'exams', label: 'Exams & Results', drawerText: 'Exams & Results' },
    { id: 'homework', label: 'Homework & Study', drawerText: 'Homework & Study' },
    { id: 'timetable', label: 'Timetable Schedules', drawerText: 'Timetable Schedules' },
    { id: 'crm', label: 'Inquiries & CRM', drawerText: 'Inquiries & CRM' },
    { id: 'announcements', label: 'Announcements & SMS', drawerText: 'Announcements & SMS' },
    { id: 'whatsapp', label: 'WhatsApp Center', drawerText: 'WhatsApp Center' },
    { id: 'settings', label: 'Academy Settings', drawerText: 'Academy Settings' }
  ];

  const results = [];

  for (const tab of tabs) {
    console.log(`\n--- Auditing Tab: ${tab.id} (${tab.label}) ---`);
    
    if (tab.bottomNavText) {
      const bNav = page.locator('.mobile-tab-item').filter({ hasText: new RegExp(`^${tab.bottomNavText}`, 'i') }).first();
      if (await bNav.isVisible().catch(() => false)) {
        await bNav.click();
      }
    } else if (tab.drawerText) {
      // Open More drawer
      const moreBtn = page.locator('.mobile-tab-item').filter({ hasText: /More/i }).first();
      await moreBtn.click();
      await page.waitForTimeout(350);
      
      const drawerItem = page.locator('.mobile-drawer-sheet button').filter({ hasText: new RegExp(tab.drawerText, 'i') }).first();
      if (await drawerItem.isVisible().catch(() => false)) {
        await drawerItem.click();
      } else {
        console.warn(`Could not find drawer item for ${tab.drawerText}`);
      }
    }

    await page.waitForTimeout(700);

    // Detailed mobile layout analysis
    const analysis = await page.evaluate(() => {
      const docWidth = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      const bodyScrollWidth = document.body.scrollWidth;
      
      const overflowingElements = [];
      const horizontalScrollContainers = [];

      document.querySelectorAll('*').forEach(el => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        
        // Check viewport overflow (cutting off on the right)
        if (rect.right > docWidth + 2 && rect.width > 0 && rect.height > 0) {
          overflowingElements.push({
            tagName: el.tagName,
            className: el.className,
            id: el.id,
            right: Math.round(rect.right),
            width: Math.round(rect.width),
            docWidth: docWidth,
            textSnippet: (el.textContent || '').trim().slice(0, 50)
          });
        }

        // Check horizontal scroll containers (excluding deliberately designed pill scrollers)
        if ((style.overflowX === 'auto' || style.overflowX === 'scroll') && !el.classList.contains('mobile-filter-scroll-bar')) {
          if (el.scrollWidth > el.clientWidth + 5) {
            horizontalScrollContainers.push({
              tagName: el.tagName,
              className: el.className,
              clientWidth: el.clientWidth,
              scrollWidth: el.scrollWidth,
              textSnippet: (el.textContent || '').trim().slice(0, 50)
            });
          }
        }
      });

      return {
        docWidth,
        scrollWidth,
        bodyScrollWidth,
        hasHorizontalOverflow: scrollWidth > docWidth || bodyScrollWidth > docWidth,
        overflowCount: overflowingElements.length,
        sampleOverflows: overflowingElements.slice(0, 6),
        horizontalScrollContainersCount: horizontalScrollContainers.length,
        horizontalScrollContainers: horizontalScrollContainers.slice(0, 4)
      };
    });

    console.log(`[${tab.id}] Overflow: ${analysis.hasHorizontalOverflow}, Scrollable containers: ${analysis.horizontalScrollContainersCount}`);
    if (analysis.hasHorizontalOverflow) {
      console.log('Overflow elements:', analysis.sampleOverflows);
    }
    if (analysis.horizontalScrollContainersCount > 0) {
      console.log('Horizontal scrollable containers:', analysis.horizontalScrollContainers);
    }

    const shotPath = path.join(screenshotsDir, `mobile_${tab.id}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });

    // Scrolled screenshot
    await page.evaluate(() => window.scrollBy(0, 450));
    await page.waitForTimeout(300);
    const shotPathScrolled = path.join(screenshotsDir, `mobile_${tab.id}_scrolled.png`);
    await page.screenshot({ path: shotPathScrolled, fullPage: false });
    await page.evaluate(() => window.scrollTo(0, 0));

    results.push({ tab: tab.id, analysis });
  }

  // Auditing Modals on Mobile
  console.log('\n--- Auditing FAB & Modals on Mobile ---');
  const fab = page.locator('.mobile-fab-main-btn');
  if (await fab.isVisible().catch(() => false)) {
    await fab.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(screenshotsDir, 'mobile_fab_opened.png') });

    // Click Add Student
    const addStudentAction = page.locator('.mobile-fab-item').first();
    if (await addStudentAction.isVisible().catch(() => false)) {
      await addStudentAction.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(screenshotsDir, 'mobile_modal_add_student.png') });
    }
  }

  await browser.close();
  console.log('\n✅ All screenshots and layout data saved in:', screenshotsDir);
  return results;
}

auditMobile().catch(err => {
  console.error('Mobile audit error:', err);
  process.exit(1);
});
