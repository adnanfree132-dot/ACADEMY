import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default admin user
  const adminPasswordHash = await bcrypt.hash('admin', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin' },
    update: { password_hash: adminPasswordHash },
    create: {
      role: 'admin',
      full_name: 'Academy Administrator',
      email: 'admin',
      phone: '+923000000000',
      password_hash: adminPasswordHash,
      is_active: true
    }
  });
  console.log('✅ Admin user created:', admin.email);

  // Create default classes
  const classes = ['Grade 9', 'Grade 10', 'Grade 11 Pre-Eng', 'Grade 12 Pre-Med'];
  for (const className of classes) {
    await prisma.class.upsert({
      where: { name: className },
      update: {},
      create: { name: className, is_active: true }
    });
  }
  console.log('✅ Default classes created');

  // Create default app settings
  const settings = [
    { key: 'academy_name', value: JSON.stringify('AcademiaPro Management OS') },
    { key: 'session_label', value: JSON.stringify('Session 2026-2027') },
    { key: 'receipt_prefix', value: JSON.stringify('REC-2026-') },
    { key: 'attendance_lock_days', value: JSON.stringify(7) }
  ];

  for (const s of settings) {
    await prisma.appSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value }
    });
  }
  console.log('✅ App settings seeded');
  console.log('🎉 Seeding complete!');
}

main()
  .catch(e => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
