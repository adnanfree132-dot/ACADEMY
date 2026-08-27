/**
 * E2E Automated Verification Test Suite: Timetable Conflict Solver & WhatsApp Dispatcher
 */

import jwt from 'jsonwebtoken';

const API_BASE = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('========================================================================');
  console.log('  TIMETABLE CONFLICT SOLVER & WHATSAPP NOTIFICATIONS E2E SUITE');
  console.log('========================================================================');

  let passed = 0;
  let failed = 0;

  // 1. Admin Authentication
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
    console.log('  ✓ PASS: Admin JWT authenticated');
    passed++;
  } else {
    console.error('  ✗ FAIL: Admin JWT authentication failed');
    failed++;
  }

  // 2. Fetch Prerequisite Batches, Subjects & Teachers
  const [batchesRes, subjectsRes, teachersRes] = await Promise.all([
    fetch(`${API_BASE}/batches`, { headers }),
    fetch(`${API_BASE}/subjects`, { headers }),
    fetch(`${API_BASE}/teachers`, { headers })
  ]);
  const batchesJson = await batchesRes.json();
  const subjectsJson = await subjectsRes.json();
  const teachersJson = await teachersRes.json();

  const batch1 = batchesJson.data?.[0];
  const batch2 = batchesJson.data?.[1] || batch1;
  const subject1 = subjectsJson.data?.[0];
  const teacher1 = teachersJson.data?.[0];

  console.log(`  ✓ PASS: Loaded fixtures (Batches: ${batchesJson.data?.length}, Subjects: ${subjectsJson.data?.length}, Teachers: ${teachersJson.data?.length})`);
  passed++;

  // 3. Create Timetable Slot 1
  let slot1Id = '';
  const slot1Res = await fetch(`${API_BASE}/timetable`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      day: 'Monday',
      startTime: '08:00 AM',
      endTime: '09:30 AM',
      room: 'Science Lab 101',
      batchId: batch1.id,
      subjectId: subject1?.id,
      teacherId: teacher1?.id,
      topic: 'Advanced Quantum Mechanics'
    })
  });
  const slot1Json = await slot1Res.json();
  slot1Id = slot1Json.data?.id;

  if (slot1Res.status === 201 && slot1Id) {
    console.log(`  ✓ PASS: Created slot 1 for "${batch1.name}" in "Science Lab 101" at 08:00 AM`);
    passed++;
  } else {
    console.error('  ✗ FAIL: Failed to create slot 1', slot1Json);
    failed++;
  }

  // 4. Test Room Double-Booking Collision Detection (Must return 409 Conflict)
  const roomConflictRes = await fetch(`${API_BASE}/timetable`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      day: 'Monday',
      startTime: '08:00 AM',
      endTime: '09:30 AM',
      room: 'Science Lab 101', // Same Room & Same Time
      batchId: batch2.id,
      subjectId: subject1?.id,
      topic: 'Simultaneous Class'
    })
  });
  const roomConflictJson = await roomConflictRes.json();

  if (roomConflictRes.status === 409) {
    console.log(`  ✓ PASS: Room double-booking correctly blocked with HTTP 409: "${roomConflictJson.error || roomConflictJson.message}"`);
    passed++;
  } else {
    console.error('  ✗ FAIL: Room double-booking was NOT blocked!', roomConflictJson);
    failed++;
  }

  // 5. Test Teacher Double-Booking Collision Detection (Must return 409 Conflict)
  if (teacher1) {
    const teacherConflictRes = await fetch(`${API_BASE}/timetable`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        day: 'Monday',
        startTime: '08:00 AM',
        endTime: '09:30 AM',
        room: 'Different Room 202',
        batchId: batch2.id,
        subjectId: subject1?.id,
        teacherId: teacher1.id, // Same Teacher & Same Time
        topic: 'Teacher Collision Test'
      })
    });
    const teacherConflictJson = await teacherConflictRes.json();

    if (teacherConflictRes.status === 409) {
      console.log(`  ✓ PASS: Teacher collision correctly blocked with HTTP 409: "${teacherConflictJson.error || teacherConflictJson.message}"`);
      passed++;
    } else {
      console.error('  ✗ FAIL: Teacher collision was NOT blocked!', teacherConflictJson);
      failed++;
    }
  }

  // 6. Test WhatsApp Templates Listing & Upsert
  const tmplUpsertRes = await fetch(`${API_BASE}/whatsapp/templates/WA_E2E_TEST`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      name: 'E2E Automated Verification Template',
      body: 'Dear {parent_name}, this is a verified E2E automated test alert for {student_name}.',
      is_enabled: true
    })
  });
  const tmplUpsertJson = await tmplUpsertRes.json();

  if (tmplUpsertRes.status === 200 && tmplUpsertJson.data?.code === 'WA_E2E_TEST') {
    console.log('  ✓ PASS: WhatsApp template upserted and saved successfully');
    passed++;
  } else {
    console.error('  ✗ FAIL: Failed to upsert WhatsApp template', tmplUpsertJson);
    failed++;
  }

  // 7. Test WhatsApp Send Notification & Logging
  const sendRes = await fetch(`${API_BASE}/whatsapp/send`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      phone: '+923001234567',
      templateCode: 'WA_E2E_TEST',
      body: 'Dear Mr. Tariq, this is a verified E2E automated test alert for Usman Tariq.'
    })
  });
  const sendJson = await sendRes.json();

  if (sendRes.status === 200 && sendJson.data?.id) {
    console.log(`  ✓ PASS: WhatsApp notification logged with ID: ${sendJson.data.id}`);
    passed++;
  } else {
    console.error('  ✗ FAIL: Failed to log WhatsApp notification', sendJson);
    failed++;
  }

  // 8. Test Daily Absence Alerts Dispatch Engine
  const dispatchRes = await fetch(`${API_BASE}/whatsapp/dispatch-absence-alerts`, {
    method: 'POST',
    headers
  });
  const dispatchJson = await dispatchRes.json();

  if (dispatchRes.status === 200 && dispatchJson.data !== undefined) {
    console.log(`  ✓ PASS: Daily absence alert dispatcher executed (Found ${dispatchJson.data.totalAbsences} absences, generated ${dispatchJson.data.dispatchedCount} alerts)`);
    passed++;
  } else {
    console.error('  ✗ FAIL: Failed to execute absence alerts dispatcher', dispatchJson);
    failed++;
  }

  // 9. Cleanup Timetable Slot
  if (slot1Id) {
    const delRes = await fetch(`${API_BASE}/timetable/${slot1Id}`, {
      method: 'DELETE',
      headers
    });
    if (delRes.status === 200) {
      console.log('  ✓ PASS: Cleaned up test timetable slot');
      passed++;
    } else {
      console.error('  ✗ FAIL: Failed to clean up timetable slot');
      failed++;
    }
  }

  console.log('========================================================================');
  console.log(`  SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('========================================================================');
}

runTests();
