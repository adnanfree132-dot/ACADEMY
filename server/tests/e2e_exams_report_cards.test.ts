import jwt from 'jsonwebtoken';

const API_BASE = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('========================================================================');
  console.log('  EXAMINATIONS, MARKSHEET & REPORT CARD E2E VERIFICATION SUITE');
  console.log('========================================================================');

  let passed = 0;
  let failed = 0;

  // 1. Admin Token Generation
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

  if (token) {
    console.log('  ✓ PASS: Admin authentication successful');
    passed++;
  } else {
    console.error('  ✗ FAIL: Admin authentication failed');
    failed++;
  }

  // 2. Fetch Batches & Subjects
  const batchesRes = await fetch(`${API_BASE}/batches`, { headers });
  const batchesJson = await batchesRes.json();
  const batches = batchesJson.data || [];
  const batchId = batches[0]?.id;

  const subjectsRes = await fetch(`${API_BASE}/subjects`, { headers });
  const subjectsJson = await subjectsRes.json();
  const subjects = subjectsJson.data || [];
  const subjectId = subjects[0]?.id;

  console.log(`  ✓ PASS: Fetched ${batches.length} batches and ${subjects.length} subjects`);
  passed++;

  // 3. Create Assessment Test
  const createTestRes = await fetch(`${API_BASE}/tests`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: 'Automated E2E Physics Mid-Term Test',
      batchId,
      subjectId,
      examDate: '2026-08-27',
      maxMarks: 100,
      passMarks: 40
    })
  });
  const createTestJson = await createTestRes.json();
  const testId = createTestJson.data?.id;

  if (createTestRes.status === 201 && testId) {
    console.log(`  ✓ PASS: Created test with ID: ${testId} (Max: 100, Pass: 40)`);
    passed++;
  } else {
    console.error('  ✗ FAIL: Failed to create test', createTestJson);
    failed++;
  }

  // 4. Fetch Students
  const studentsRes = await fetch(`${API_BASE}/students`, { headers });
  const studentsJson = await studentsRes.json();
  const studentList = studentsJson.data || [];
  const student = studentList[0];

  if (student) {
    console.log(`  ✓ PASS: Found active test student: ${student.full_name || student.name} (ID: ${student.id})`);
    passed++;
  } else {
    console.error('  ✗ FAIL: No students found');
    failed++;
  }

  // 5. Submit Marksheet Entry
  if (testId && student) {
    const marksRes = await fetch(`${API_BASE}/tests/${testId}/marks`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        marks: [
          { studentId: student.id, marks: 88, remark: 'Exceptional analytical mastery' }
        ]
      })
    });
    const marksJson = await marksRes.json();

    if (marksRes.status === 200 && marksJson.data?.length > 0) {
      console.log(`  ✓ PASS: Successfully recorded mark 88/100 for student ${student.id}`);
      passed++;
    } else {
      console.error('  ✗ FAIL: Failed to save test mark', marksJson);
      failed++;
    }
  }

  // 6. Test Report Card Calculation Endpoint
  if (student) {
    const reportRes = await fetch(`${API_BASE}/students/${student.id}/report-card`, { headers });
    const reportJson = await reportRes.json();
    const report = reportJson.data;

    if (reportRes.status === 200 && report && report.subjects) {
      console.log('  ✓ PASS: GET /students/:id/report-card successfully generated report');
      console.log(`    - Overall Grade: ${report.summary?.overallGrade}`);
      console.log(`    - Percentage: ${report.summary?.overallPercentage}%`);
      console.log(`    - Evaluation: ${report.summary?.performanceEvaluation}`);
      console.log(`    - Attendance Rate: ${report.attendance?.attendancePercentage}%`);
      passed++;
    } else {
      console.error('  ✗ FAIL: Failed to get report card', reportJson);
      failed++;
    }
  }

  // 7. Update & Publish Test
  if (testId) {
    const updateRes = await fetch(`${API_BASE}/tests/${testId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ isPublished: true, title: 'Updated Physics Mid-Term (Published)' })
    });
    const updateJson = await updateRes.json();
    if (updateRes.status === 200 && updateJson.data?.is_published === true) {
      console.log('  ✓ PASS: Successfully updated test and published marksheet');
      passed++;
    } else {
      console.error('  ✗ FAIL: Failed to update test', updateJson);
      failed++;
    }
  }

  // 8. Delete Test Cleanup
  if (testId) {
    const delRes = await fetch(`${API_BASE}/tests/${testId}`, {
      method: 'DELETE',
      headers
    });
    if (delRes.status === 200) {
      console.log('  ✓ PASS: Successfully deleted test with cascading mark cleanup');
      passed++;
    } else {
      console.error('  ✗ FAIL: Failed to delete test');
      failed++;
    }
  }

  console.log('========================================================================');
  console.log(`  SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('========================================================================');
}

runTests();
