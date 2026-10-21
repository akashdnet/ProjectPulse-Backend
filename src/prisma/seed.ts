import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const mentorEmail = process.env.MENTOR_SEED_EMAIL || 'mentor@projectpulse.dev';
  const mentorPassword = process.env.MENTOR_SEED_PASSWORD;
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

  if (!mentorPassword) {
    throw new Error(
      'MENTOR_SEED_PASSWORD environment variable is not defined! Please set MENTOR_SEED_PASSWORD in your .env file before running seed.'
    );
  }

  const existingMentor = await prisma.user.findUnique({
    where: { email: mentorEmail },
  });

  if (!existingMentor) {
    const hashedPassword = await bcrypt.hash(mentorPassword, saltRounds);
    const mentor = await prisma.user.create({
      data: {
        name: 'Default Mentor',
        email: mentorEmail,
        password: hashedPassword,
        role: Role.MENTOR,
      },
    });
    console.log(`✓ Default mentor created successfully: ${mentor.email}`);
  } else {
    console.log(`ℹ Mentor already exists: ${existingMentor.email}`);
  }
}

main()
  .catch((e) => {
    console.error('✗ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
