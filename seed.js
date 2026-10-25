import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@azharix.local';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const passwordHash = await bcrypt.hash('ChangeMe123!', 12);
    await prisma.user.create({
      data: { name: 'AZHARIX Administrator', email, passwordHash, role: 'SUPER_ADMIN' }
    });
    console.log('Demo admin created: admin@azharix.local / ChangeMe123!');
  } else {
    console.log('Demo admin already exists; no changes made.');
  }

  const studentCount = await prisma.student.count();
  if (studentCount === 0) {
    await prisma.student.createMany({
      data: [
        { studentCode: 'AZH-2026-001', firstName: 'Ayesha', lastName: 'Khan', className: 'First Year', section: 'A', guardianName: 'Muhammad Khan', guardianPhone: '03000000001' },
        { studentCode: 'AZH-2026-002', firstName: 'Hamza', lastName: 'Ali', className: 'Second Year', section: 'B', guardianName: 'Ali Ahmed', guardianPhone: '03000000002' },
        { studentCode: 'AZH-2026-003', firstName: 'Fatima', lastName: 'Raza', className: 'First Year', section: 'A', guardianName: 'Raza Ahmed', guardianPhone: '03000000003' }
      ]
    });
    console.log('Development sample students created.');
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => prisma.$disconnect());
