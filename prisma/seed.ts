import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getSeedAdminCredentials } from '../src/lib/seed-admin';

const prisma = new PrismaClient();

async function main() {
  const { email, password } = getSeedAdminCredentials();

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin ${email} already exists — skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.admin.create({
    data: { email, passwordHash, name: 'Site Administrator' },
  });

  console.log(`Created admin account:
  email:    ${email}
  password: ${password}

Sign in at /login, then change this password by creating a new admin
row and deleting this one, or by adding a "change password" flow before
go-live.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
