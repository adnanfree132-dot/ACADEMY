/**
 * Root alias launcher for server/tests/e2e_payroll_attendance.test.ts
 */
import { main } from '../server/tests/e2e_payroll_attendance.test';

main().catch((err) => {
  console.error('Test runner execution failed:', err);
  process.exit(1);
});
