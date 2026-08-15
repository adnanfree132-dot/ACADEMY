const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function run() {
  const hash = await bcrypt.hash('admin', 10);
  await prisma.user.updateMany({
    where: { email: 'admin@academiapro.com' },
    data: { email: 'admin', password_hash: hash }
  });
  console.log('Database updated successfully!');
}

run().finally(() => prisma.$disconnect());
