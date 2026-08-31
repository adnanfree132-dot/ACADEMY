import { getDaysInMonth, roundCurrency, calculateAbsenceDeduction, numberToWords, calculateStaffPayrollItem, generatePayslipNumber, formatWhatsAppPayslipAdvice, StaffMemberInfo, SalaryStructureInfo, AttendanceStats } from '../src/utils/payrollCalculator';
import express from 'express';
import routes from '../src/routes';
import http from 'http';
import https from 'https';
import { URL } from 'url';
import jwt from 'jsonwebtoken';
import prisma from '../src/prisma';

const TEST_PORT = 5099;
const BASE_URL = `http://localhost:${TEST_PORT}/api/v1`;

export class StressTestRunner {
  total = 0; passed = 0; failed = 0;
  failures: Array<{ name: string; error: string; details?: any }> = [];

  section(title: string) {
    console.log('\n\x1b[1m\x1b[34m=== [SECTION: ' + title + '] ===\x1b[0m');
  }

  assert(cond: boolean, name: string, details?: any) {
    this.total++;
    if (cond) {
      this.passed++;
      console.log('  \x1b[32m⤜ PASS:\x1b[0m ' + name);
    } else {
      this.failures.push({ name, error: 'Assertion failed', details });
      this.failed++;
      console.error('  \x1b[31m❗ FAIL:\x1b[0m ' + name);
      if (details) console.error('    Details:', details);
    }
  }

  assertEqual(actual: any, expected: any, name: string) {
    this.total++;
    if (actual === expected) {
      this.passed++;
      console.log('  \x1b[32m⤜ PASS:\x1b[0m ' + name);
    } else {
      this.failures.push({ name, error: 'Mismatch', details: { expected, actual } });
      this.failed++;
      console.error('  \x1b[31m❗ FAIL:\x1b[0m ' + name + ' (Expected: ' + JSON.stringify(expected) + ', Got: ' + JSON.stringify(actual) + ')');
    }
  }

  assertAlmostEqual(actual: number, expected: number, tol = 0.01, name: string) {
    this.total++;
    const diff = Math.abs(actual - expected);
    if (diff <= tol) {
      this.passed++;
      console.log('  \x1b[32m✓ PASS:\x1b[0m ' + name);
    } else {
      this.failed++;
      this.failures.push({ name, error: 'Out of tolerance', details: { expected, actual, diff } });
      console.error('  \x1b[31m❗ FAIL:\x1b[0m ' + name + ' (Expected: ' + expected + ' +/-' + tol + ', Got: ' + actual + ', Diff: ' + diff + ')');
    }
  }

  summary() {
    console.log('\n\x1b[1m\x1b[36m=======================================================================\x1b[0m');
    console.log('\x1b[1m\x1b[37m  CHALLENGER 2: ADVERSARIAL FINANCIAL & BATCH PAYROLLS TRESSTTEST RESULTS\x1b[0m');
    console.log('\x1b[1m\x1b[36m========================================================================\x1b[0m');
    console.log('  Total Executed : \x1b[1m' + this.total + '\x1b[0m');
    console.log('  Passed         : \x1b[32m\x1b[1m' + this.passed + '\x1b[0m');
    console.log('  Failed         : \x1b[' + (this.failed > 0 ? '31' : '32') + 'm\x1b[1m' + this.failed + '\x1b[0m');
    console.log('  Pass Rate      : \x1b[' + (this.passed === this.total ? '32' : '33') + 'm\x1b[1m' + ((this.passed / this.total) * 100).toFixed(2) + '%\x1b[0m');
    if (this.failures.length > 0) {
      console.log('\n\x1b[31m  Failures Breakdown:\x1b[0m');
      this.failures.forEach((f, i) => console.log('  ' + (i + 1) + '. ' + f.name + ' -> ' + f.error));
    }
    console.log('\x1b[1m\x1b[36m========================================================================\x1b[0m\n');
    return { total: this.total, passed: this.passed, failed: this.failed, failures: this.failures };
  }
}

async function apiRequest(endpoint: string, options: { method?: string; body?: any; token?: string } = {}) {
  const url = new URL(endpoint.startsWith('http') ? endpoint : BASE_URL + (endpoint.startsWith('/') ? '' : '/') + endpoint);
  const method = options.method || 'GET';
  const headers: Record<string, string> = { 'Accept': 'application/json' };
  let bodyData: string | null = null;
  if (options.body) {
    bodyData = JSON.stringify(options.body);
    headers['Content-Type'] = 'application/json';
    headers['Content-Length'] = String(Buffer.byteLength(bodyData));
  }
  if (options.token) {
    headers['Authorization'] = 'Bearer ' + options.token;
  }

  return new Promise<{ status: number; body: any }>((resolve) => {
    const client = url.protocol === 'https:' ? https : http;
    const req = client.request({
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers,
      timeout: 10000
    }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json: any = null;
        try { json = JSON.parse(data); } catch { json = { raw: data }; }
        resolve({ status: res.statusCode || 0, body: json });
      });
    });
    req.on('error', (err) => resolve({ status: 0, body: { error: err.message } }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 408, body: { error: 'timeout' } });
    });
    if (bodyData) req.write(bodyData);
    req.end();
  });
}


async function getJwtToken(): Promise<string> {
  const dbUser = await prisma.user.findFirst();
  const secret = process.env.JWT_ACCESS_SECRET || 'academiapro_access_secret_key_2026';
  return jwt.sign(
    {
      userId: dbUser ? dbUser.id : 'admin-id',
      username: dbUser ? dbUser.username : 'admin',
      role: 'admin',
      fullName: dbUser ? dbUser.full_name : 'Stress Test Admin',
      email: dbUser ? dbUser.email : 'admin@academiapro.edu'
    },
    secret,
    { expiresIn: '1h' }
  );
}

export async function runAdversarialStressSuite() {
  const t = new StressTestRunner();
  // =======================================================================
  // STRESS 1: CALENDAR & LEAP YEAR VARIATIONS 
  // =======================================================================
  t.section('1. Calendar Variations & Leap Year Rigor');

  const thirtyOneMonths = [1, 3, 5, 7, 8, 10, 12];
  for (const m of thirtyOneMonths) {
    t.assertEqual(getDaysInMonth(2026, m), 31, `Month ${m} in 2026 has exactly 31 days`);
    t.assertEqual(getDaysInMonth(2024, m), 31, `Month ${m} in 2024 has exactly 31 days`);
    t.assertEqual(getDaysInMonth(1999, m), 31, `Month ${m} in 1999 has exactly 31 days`);
    t.assertEqual(getDaysInMonth(2050, m), 31, `Month ${m} in 2050 has exactly 31 days`);
  }

  const thirtyMonths = [4, 6, 9, 11];
  for (const m of thirtyMonths) {
    t.assertEqual(getDaysInMonth(2026, m), 30, `Month ${m} in 2026 has exactly 30 days`);
    t.assertEqual(getDaysInMonth(2024, m), 30, `Month ${m} in 2024 has exactly 30 days`);
    t.assertEqual(getDaysInMonth(2000, m), 30, `Month ${m} in 2000 has exactly 30 days`);
    t.assertEqual(getDaysInMonth(2099, m), 30, `Month ${m} in 2099 has exactly 30 days`);
  }


  const leapYearsDiv4 = [2004, 2008, 2012, 2016, 2020, 2024, 2028, 2032, 2036, 2040, 2044, 2048];
  for (const y of leapYearsDiv4) {
    t.assertEqual(getDaysInMonth(y, 2), 29, `Feb ${y} (divisible by 4) has 29 days`);
  }


  const centuryNonLeap = [1700, 1800, 1900, 2100, 2200, 2300, 2500];
  for (const y of centuryNonLeap) {
    t.assertEqual(getDaysInMonth(y, 2), 28, `Feb ${y} (century not div by 400) has 28 days`);
  }


  const quadCenturyLeap = [1600, 2000, 2400, 2800];
  for (const y of quadCenturyLeap) {
    t.assertEqual(getDaysInMonth(y, 2), 29, `Feb ${y} (century div by 400) has 29 days`);
  }


  const standardYears = [2021, 2022, 2023, 2025, 2026, 2027, 2029, 2030, 2031];
  for (const y of standardYears) {
    t.assertEqual(getDaysInMonth(y, 2), 28, `Feb ${y} (standard non-leap) has 28 days`);
  }


  t.assertEqual(getDaysInMonth(0, 0), 30, 'getDaysInMonth(0, 0) falls back to safe default 30');
  t.assertEqual(getDaysInMonth(NaN, 5), 30, 'getDaysInMonth(NaN, 5) falls back to safe default 30');
  t.assertEqual(getDaysInMonth(2026, NaN), 30, 'getDaysInMonth(2026, NaN) falls back to safe default 30');


  // ======================================================================
  // STRESS 2: EXTREME MONETARY VALUES &PENNY PRECISION
  // ======================================================================
  t.section('2. Extreme Monetary Values & Penny Precision');

  const zeroBaseItem = calculateStaffPayrollItem(
    { id: 'stf-0', staff_id: 'STF-0', full_name: 'Volunteer Staff' },
    { base_salary: 0, house_rent_allowance: 10000, medical_allowance: 5000, tax_deduction: 0, provident_fund: 0 },
    { calendarDays: 31, presentDays: 20, absentDays: 11, unexcusedAbsences: 11 },
    2026,
    8
  );
  t.assertEqual(zeroBaseItem.baseSalary, 0, 'Zero base salary is 0');
  t.assertEqual(zeroBaseItem.grossSalary, 15000, 'Gross salary equals sum of allowances (15,000)');
  t.assertEqual(zeroBaseItem.attendanceDeduction, 0, 'Absence deduction on 0 base salary is 0');
  t.assertEqual(zeroBaseItem.netPayable, 15000, 'Net payable equals gross salary when base is 0');

  const execItem = calculateStaffPayrollItem(
    { id: 'exec-1', staff_id: 'EXEC-001', full_name: 'Chancellor / CEO' },
    {
      base_salary: 10000000,
      house_rent_allowance: 3000000,
      medical_allowance: 1000000,
      special_allowance: 2000000,
      tax_deduction: 4500000,
      provident_fund: 500000
    },
    { calendarDays: 31, presentDays: 30, absentDays: 1, unexcusedAbsences: 1 },
    2026,
    8
  );
  t.assertEqual(execItem.grossSalary, 16000000, 'Executive Gross: 1.6 Crore (16,000,000)');
  t.assertEqual(execItem.attendanceDeduction, 322580.65, '1 day absence deduction on 1 Crore base is 322,580.65');
  t.assertEqual(execItem.statutoryDeductions, 5000000, 'Statutory deductions: 5,000,000');
  t.assertEqual(execItem.totalDeductions, 5322580.65, 'Total deductions: 5,322,580.65');
  t.assertEqual(execItem.netPayable, 10677419.35, 'Executive Net Payable: 10,677,419.35');
  t.assert(execItem.netPayableWords.includes('Crore'), 'netPayableWords includes Crore denomination', execItem.netPayableWords);


  const multiCroreItem = calculateStaffPayrollItem(
    { id: 'exec-100', staff_id: 'EXEC-100', full_name: 'Group Chairman' },
    { base_salary: 100000000, tax_deduction: 35000000 },
    { calendarDays: 31, unexcusedAbsences: 0 },
    2026,
    8
  );
  t.assertEqual(multiCroreItem.grossSalary, 100000000, '100M Gross');
  t.assertEqual(multiCroreItem.netPayable, 65000000, '65M Net Payable (100M - 35M)');
  t.assert(multiCroreItem.netPayableWords.includes('Crore'), '10 Crore words conversion contains Crore', multiCroreItem.netPayableWords);


  t.assertEqual(roundCurrency(0.1 + 0.2), 0.30, 'roundCurrency(0.1 + 0.2) equals exactly 0.3');

  let sumRounded = 0;
  for (let i = 0; i < 100; i++) {
    sumRounded += roundCurrency(123.456);
  }
  t.assertEqual(roundCurrency(sumRounded), 12346.00, 'Sum of 100 rounded components (123.46 * 100) = 12346.00');
  // ======================================================================
  // STRESS 3: ABSENCE COMBINATIONS &PRO-RATA DEDUCTIONS
  // ======================================================================
  t.section('3. Absence Combinations & Pro-Rata Deductions');

  for (const days of [28, 29, 30, 31]) {
    const ded = calculateAbsenceDeduction(75000, days, 0);
    t.assertEqual(ded, 0, `0 absences in ${days}-day month produces exactly 0 deduction`);
  }

  for (const days of [28, 29, 30, 31]) {
    const ded = calculateAbsenceDeduction(62000, days, days);
    t.assertEqual(ded, 62000, `Full month (${days}/${days}) absence deducts exactly 100% base salary (62,000)`);
  }

  t.assertEqual(calculateAbsenceDeduction(60000, 30, 0.5), 1000.00, '0.5 half-day on 60k base in 30d = 1000.00');
  t.assertEqual(calculateAbsenceDeduction(60000, 30, 1.5), 3000.00, '1.5 units on 60k base in 30d = 3000.00');
  t.assertEqual(calculateAbsenceDeduction(62000, 31, 2.5), 5000.00, '2.5 units on 62k base in 31d = 5000.00');
  t.assertEqual(calculateAbsenceDeduction(62000, 31, 15.5), 31000.00, '15.5 units on 62k base in 31d = 31000.00');

  const mixedItem = calculateStaffPayrollItem(
    { id: 'stf-m', staff_id: 'STF-M', full_name: 'Mixed Leave Staff' },
    { base_salary: 62000, house_rent_allowance: 10000 },
    {
      calendarDays: 31,
      presentDays: 20,
      lateDays: 2,
      excusedLeaves: 5,
      onDutyDays: 2,
      absentDays: 1,
      halfDays: 2
    },
    2026,
    8
  );
  t.assertEqual(mixedItem.unexcusedUnits, 2, 'Unexcused units isolate 1 absent + 2 half days = 2.0 units (excluding 5 excused & 2 on duty)');
  t.assertEqual(mixedItem.attendanceDeduction, 4000, 'Absence deduction for 2 units on 62k in 31d is (62000 / 31) * 2 = 4000');

  const excessiveDed = calculateAbsenceDeduction(60000, 30, 35);
  t.assertEqual(excessiveDed, 70000, '35 absence units on 30d month computes (60k / 30) * 35 = 70,000');
  const excessiveItem = calculateStaffPayrollItem(
    { id: 'stf-ex', staff_id: 'STF-EX', full_name: 'Excessive Absentee' },
    { base_salary: 60000 },
    { calendarDays: 30, unexcusedAbsences: 35 },
    2026,
    9
  );
  t.assertEqual(excessiveItem.attendanceDeduction, 70000, 'Attendance deduction computed as 70,000');
  t.assertEqual(excessiveItem.netPayable, 0, 'Excessive deduction correctly clamped to 0 net payable');

  // ======================================================================
  // STRESS 4: NET SALARY PROTECTION & NEGATIVE BALANCE GUARD
  // ======================================================================
  t.section('4. Net Salary Protection & Clamp');

  const overDeductedItem = calculateStaffPayrollItem(
    { id: 'stf-od', staff_id: 'STF-OD', full_name: 'Over Deducted' },
    {
      base_salary: 50000,
      house_rent_allowance: 10000,
      tax_deduction: 40000,
      provident_fund: 25000,
      other_deductions: 10000
    },
    { calendarDays: 31, unexcusedAbsences: 0 },
    2026,
    8
  );
  t.assertEqual(overDeductedItem.grossSalary, 60000, 'Gross salary is 60,000');
  t.assertEqual(overDeductedItem.totalDeductions, 75000, 'Total deductions is 75,000 (exceeds gross)');
  t.assertEqual(overDeductedItem.netPayable, 0, 'Net payable clamped strictly to 0.00 (not -15,000)');
  t.assertEqual(overDeductedItem.netPayableWords, 'Zero Rupees Only', 'netPayableWords for 0 is "Zero Rupees Only"');


  const exactDeductedItem = calculateStaffPayrollItem(
    { id: 'stf-eq', staff_id: 'STF-EQ', full_name: 'Exact Deducted' },
    { base_salary: 50000, tax_deduction: 50000 },
    { calendarDays: 31, unexcusedAbsences: 0 },
    2026,
    8
  );
  t.assertEqual(exactDeductedItem.grossSalary, 50000, 'Gross salary is 50,000');
  t.assertEqual(exactDeductedItem.totalDeductions, 50000, 'Total deductions is 50,000');
  t.assertEqual(exactDeductedItem.netPayable, 0, 'Net payable is exactly 0.00');


  const onePaisaItem = calculateStaffPayrollItem(
    { id: 'stf-1p', staff_id: 'STF-3P', full_name: 'One Paisa Remaining' },
    { base_salary: 50000, tax_deduction: 49999.99 },
    { calendarDays: 31, unexcusedAbsences: 0 },
    2026,
    8
  );
  t.assertEqual(onePaisaItem.netPayable, 0.01, 'Net payable is exactly 0.01 (1 Paisa)');


  const onePaisaOverItem = calculateStaffPayrollItem(
    { id: 'stf-1po', staff_id: 'STF-1PO', full_name: 'One Paisa Over' },
    { base_salary: 50000, tax_deduction: 50000.01 },
    { calendarDays: 31, unexcusedAbsences: 0 },
    2026,
    8
  );
  t.assertEqual(onePaisaOverItem.netPayable, 0, 'Net payable is clamped to 0.00 when over by 1 paisa');
  // ======================================================================
  // STRESS 5: BATCH AGGREGATION INTEGRITY & PROPERTY-BASED TESTING
  // ======================================================================
  t.section('5. Batch Aggregation Integrity & Property-Based Simulation');

  const batchStaffCount = 50;
  const staffPayrollList: any[] = [];

  for (let i = 1; i <= batchStaffCount; i++) {
    const base = 30000 + (i * 2500);
    const hra = Math.round(base * 0.2);
    const med = Math.round(base * 0.08);
    const conv = 3000 + (i * 100);
    const spec = i % 5 === 0 ? 10000 : 0;

    const tax = Math.round(base * 0.05);
    const pf = Math.round(base * 0.04);
    const other = i % 10 === 0 ? 5000 : 0;

    const absences = (i % 7);
    const halfDays = (i % 3);

    const item = calculateStaffPayrollItem(
      {
        id: `staff-sim-${i}`,
        staff_id: `FAC-${String(i).padStart(3, '0')}`,
        full_name: `Faculty Member ${i}`,
        designation: i % 2 === 0 ? 'Associate Professor' : 'Lecturer'
      },
      {
        base_salary: base,
        house_rent_allowance: hra,
        medical_allowance: med,
        conveyance_allowance: conv,
        special_allowance: spec,
        tax_deduction: tax,
        provident_fund: pf,
        other_deductions: other
      },
      {
        calendarDays: 31,
        presentDays: 31 - absences - halfDays,
        absentDays: absences,
        halfDays: halfDays,
        unexcusedAbsences: absences + 0.5 * halfDays
      },
      2026,
      8
    );
    staffPayrollList.push(item);
  }

  let aggBase = 0;
  let aggHRA = 0;
  let aggMed = 0;
  let aggConv = 0;
  let aggSpec = 0;
  let aggGross = 0;
  let aggAbsenceDed = 0;
  let aggTax = 0;
  let aggPF = 0;
  let aggOther = 0;
  let aggTotalDed = 0;
  let aggNet = 0;

  for (const p of staffPayrollList) {
    const expectedGross = roundCurrency(p.baseSalary + p.houseRentAllowance + p.medicalAllowance + p.conveyanceAllowance + p.specialAllowance);
    t.assertEqual(p.grossSalary, expectedGross, `Staff ${p.staffCode} Gross = sum(earnings)`);

    const expectedStatutory = roundCurrency(p.taxDeduction + p.providentFund + p.otherDeductions);
    t.assertEqual(p.statutoryDeductions, expectedStatutory, `Staff ${p.staffCode} Statutory = sum(statutory deductions)`);

    const expectedTotalDed = roundCurrency(p.attendanceDeduction + p.statutoryDeductions);
    t.assertEqual(p.totalDeductions, expectedTotalDed, `Staff ${p.staffCode} Total Deductions = absence + statutory`);

    const expectedNet = Math.max(0, roundCurrency(p.grossSalary - p.totalDeductions));
    t.assertEqual(p.netPayable, expectedNet, `Staff ${p.staffCode} Net = max(0, gross - total deductions)`);

    aggBase += p.baseSalary;
    aggHRA += p.houseRentAllowance;
    aggMed += p.medicalAllowance;
    aggConv += p.conveyanceAllowance;
    aggSpec += p.specialAllowance;
    aggGross += p.grossSalary;
    aggAbsenceDed += p.attendanceDeduction;
    aggTax += p.taxDeduction;
    aggPF += p.providentFund;
    aggOther += p.otherDeductions;
    aggTotalDed += p.totalDeductions;
    aggNet += p.netPayable;
  }

  aggGross = roundCurrency(aggGross);
  aggTotalDed = roundCurrency(aggTotalDed);
  aggNet = roundCurrency(aggNet);

  t.assertAlmostEqual(aggGross, roundCurrency(aggBase + aggHRA + aggMed + aggConv + aggSpec), 0.05, 'Aggregate Gross equals sum of aggregate earnings breakdown');
  t.assertAlmostEqual(aggTotalDed, roundCurrency(aggAbsenceDed + aggTax + aggPF + aggOther), 0.05, 'Aggregate Deductions equals sum of all itemized deductions');
  t.assertAlmostEqual(aggGross - aggTotalDed, aggNet, 0.05, 'Aggregate Ledger Balance: Gross - Total Deductions = Net (all 50 staff non-clamped)');
  // ======================================================================
  // STRESS 6: NUMBER TO WORDS & WHATSAPP ADVICE RENDERING
  // ======================================================================
  t.section('6. Number to Words & WhatsApp Advice Generation');

  t.assertEqual(numberToWords(0), 'Zero Rupees Only', 'numberToWords(0) is Zero Rupees Only');
  t.assertEqual(numberToWords(5), 'Five Rupees Only', 'numberToWords(5)');
  t.assertEqual(numberToWords(15), 'Fifteen Rupees Only', 'numberToWords(15)');
  t.assertEqual(numberToWords(85), 'Eighty Five Rupees Only', 'numberToWords(85)');
  t.assertEqual(numberToWords(100), 'One Hundred Rupees Only', 'numberToWords(100)');
  t.assertEqual(numberToWords(1250), 'One Thousand Two Hundred Fifty Rupees Only', 'numberToWords(1250)');
  t.assertEqual(numberToWords(104000), 'One Lakh Four Thousand Rupees Only', 'numberToWords(104000)');
  t.assertEqual(numberToWords(104000.50), 'One Lakh Four Thousand Rupees and Fifty Paisas Only', 'numberToWords(104000.50)');
  t.assertEqual(numberToWords(15000000), 'One Crore Fifty Lakh Rupees Only', 'numberToWords(15000000)');

  const advice = formatWhatsAppPayslipAdvice({
    payslip_number: 'SLIP-2026-08-FAC001',
    fullName: 'Dr. Sarah Khan',
    staffCode: 'FAC-001',
    designation: 'Senior Faculty',
    base_pay: 80000,
    house_rent_allowance: 20000,
    medical_allowance: 8000,
    conveyance_allowance: 5000,
    grossSalary: 113000,
    attendance_deduction_amount: 0,
    tax_deduction: 5000,
    provident_fund: 4000,
    totalDeductions: 9000,
    net_payable: 104000,
    payment_method: 'Bank Transfer',
    bank_name: 'Meezan Bank',
    account_number: '1234567890',
    transaction_ref: 'TXN-998877'
  }, 'Academia Model Campus');

  t.assert(advice.includes('ACADEMIA MODEL CAMPUS'), 'WhatsApp advice contains uppercase institution name');
  t.assert(advice.includes('Dr. Sarah Khan (FAC-001)'), 'WhatsApp advice contains employee name and code');
  t.assert(advice.includes('PKR 104,000'), 'WhatsApp advice contains formatted net pay');
  t.assert(advice.includes('Ref: TXN-998877'), 'WhatsApp advice contains transaction reference');


  // ======================================================================
  // STRESS 7: LIVE CONTROLLER & API ENDPOINT STRESS
  // ======================================================================
  t.section('7. Live Controller & API Endpoint Stress');

  const testApp = express();
  testApp.use(express.json());
  testApp.use('/api/v1', routes);

  const serverInstance = await new Promise<http.Server>((resolve) => {
    const s = testApp.listen(TEST_PORT, () => resolve(s));
  });

  try {
    const token = await getJwtToken();

    const batchRes1 = await apiRequest('/payroll/generate-batch', {
      method: 'POST',
      body: { month: 8, year: 2026, notes: 'Adversarial Stress Test Batch 1' },
      token
    });
    t.assert([200, 201].includes(batchRes1.status) || (batchRes1.status === 400 && batchRes1.body?.error), 'POST /api/v1/payroll/generate-batch generates or validates batch', batchRes1.body);

    const batchRes2 = await apiRequest('/payroll/generate-batch', {
      method: 'POST',
      body: { month: 8, year: 2026, notes: 'Adversarial Stress Test Batch 2 (Idempotent Overwrite)' },
      token
    });
    t.assert([200, 201].includes(batchRes2.status) || (batchRes2.status === 400 && batchRes2.body?.error), 'POST /api/v1/payroll/generate-batch handles batch regeneration idempotently', batchRes2.body);

    const listRes = await apiRequest('/payroll/batches', { token });
    t.assert([200, 304].includes(listRes.status) && listRes.body?.success === true, 'GET /api/v1/payroll/batches returns success envelope', listRes.body);

    const staffRes = await apiRequest('/staff', { token });
    if (staffRes.status === 200 && Array.isArray(staffRes.body?.data) && staffRes.body.data.length > 0) {
      const targetStaff = staffRes.body.data[0];
      const upsertRes = await apiRequest('/staff-salary-structures', {
        method: 'POST',
        body: {
          staff_member_id: targetStaff.id,
          base_salary: 85000,
          house_rent_allowance: 20000,
          medical_allowance: 8000,
          conveyance_allowance: 5000,
          special_allowance: 4000,
          tax_deduction: 6000,
          provident_fund: 4000,
          other_deductions: 1000,
          payment_frequency: 'monthly',
          bank_name: 'Standard Chartered',
          account_number: 'PK99SCBL000123456789',
          account_title: targetStaff.full_name
        },
        token
      });
      t.assert([200, 201].includes(upsertRes.status) && upsertRes.body?.success === true, 'POST /api/v1/staff-salary-structures updates structure and staff base_salary', upsertRes.body);

      const getStructRes = await apiRequest('/staff-salary-structures/' + targetStaff.id, { token });
      t.assert(getStructRes.status === 200 && getStructRes.body?.data?.base_salary === 85000, 'GET /api/v1/staff-salary-structures/:id returns updated 85,000 base salary', getStructRes.body);
    }
  } finally {
    serverInstance.close();
  }

  return t.summary();
}

if (require.main === module) {
  runAdversarialStressSuite().then((res) => {
    process.exit(res.failed > 0 ? 1 : 0);
  });
}
