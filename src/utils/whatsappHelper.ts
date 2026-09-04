// WhatsApp Center Core Utility (SPEC_V3 Section 7)

export interface WhatsAppTemplate {
  code: string;
  name: string;
  body: string;
}

export const DEFAULT_WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    code: 'WA_WELCOME',
    name: 'Admission Welcome & Credentials',
    body: 'Dear {parent_name}, {student_name} is admitted to {academy_name}. Admission No: {admission_no}. Login: {username} / Password: {password}. Please change password after first login.'
  },
  {
    code: 'WA_FEE_REMINDER',
    name: 'Monthly Fee Due Reminder',
    body: 'Dear {parent_name}, {student_name} fee for {month} = {currency} {amount}, due {due_date}. Please pay on time. – {academy_name}'
  },
  {
    code: 'WA_DEFAULTER',
    name: 'Overdue Fee Defaulter Alert',
    body: 'Dear {parent_name}, {student_name} fee is {days_overdue} days overdue. Outstanding {currency} {balance}. Please clear immediately. – {academy_name}'
  },
  {
    code: 'WA_RECEIPT',
    name: 'Payment Receipt Confirmation',
    body: 'Payment received: {currency} {amount} ({method}) for {student_name}. Receipt No: {receipt_no}. Remaining: {currency} {balance}. – {academy_name}'
  },
  {
    code: 'WA_ABSENT',
    name: 'Student Absence Notification',
    body: '{student_name} was marked ABSENT on {date} ({batch_name}). – {academy_name}'
  },
  {
    code: 'WA_LOW_ATT',
    name: 'Low Attendance Warning',
    body: '{student_name} attendance this month is {attendance_pct}%. Please ensure regularity. – {academy_name}'
  },
  {
    code: 'WA_RESULT',
    name: 'Assessment Test Result',
    body: '{student_name} scored {marks}/{max_marks} ({grade}) in {test_name}. – {academy_name}'
  },
  {
    code: 'WA_HOMEWORK',
    name: 'New Homework Assignment',
    body: 'New homework for {batch_name}: {homework_title}, due {due_date}. – {academy_name}'
  },
  {
    code: 'WA_PROMOTED',
    name: 'Class Promotion Notification',
    body: 'Congratulations! {student_name} is promoted to {class_name}. – {academy_name}'
  }
];

export function fillTemplate(templateBody: string, variables: Record<string, string | number>): string {
  let result = templateBody;
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, String(variables[key]));
  });
  return result;
}

export function openWhatsAppLink(phone: string, message: string) {
  // Normalize phone digits
  const cleanPhone = phone.replace(/\D/g, '');
  const encodedText = encodeURIComponent(message);
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;
  window.open(waUrl, '_blank');
}
