import bcrypt from 'bcrypt';
import { Role, UserStatus } from '@prisma/client';
import prisma from '../app/utils/prisma';

export const seedSuperAdmin = async (): Promise<void> => {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@admin.com';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'adminadmin';
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });

  if (!existingSuperAdmin) {
    const hashedPassword = await bcrypt.hash(superAdminPassword, saltRounds);
    const superAdmin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: superAdminEmail,
        password: hashedPassword,
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    console.log(`✓ Super admin created successfully: ${superAdmin.email}`);
  } else {
    console.log(`ℹ Super admin already exists: ${existingSuperAdmin.email}`);
  }

  // Mentor: lead_mentor@example.com (Approved by Admin)
  const mentorEmail = 'lead_mentor@example.com';
  const mentorPassword = process.env.MENTOR_PASSWORD || 'password123';
  const existingMentor = await prisma.user.findUnique({
    where: { email: mentorEmail },
  });

  if (!existingMentor) {
    const hashedMentorPassword = await bcrypt.hash(mentorPassword, saltRounds);
    const mentor = await prisma.user.create({
      data: {
        name: 'Lead Mentor',
        email: mentorEmail,
        password: hashedMentorPassword,
        role: Role.MENTOR,
        status: UserStatus.ACTIVE, // Admin approved
      },
    });
    console.log(`✓ Mentor created and approved: ${mentor.email}`);
  } else {
    if (existingMentor.status !== UserStatus.ACTIVE) {
      await prisma.user.update({
        where: { email: mentorEmail },
        data: { status: UserStatus.ACTIVE },
      });
      console.log(`✓ Mentor account approved to ACTIVE: ${existingMentor.email}`);
    } else {
      console.log(`ℹ Mentor already exists and is ACTIVE: ${existingMentor.email}`);
    }
  }

  // Student: teststudent_auto@test.com
  const studentEmail = 'teststudent_auto@test.com';
  const studentPassword = process.env.STUDENT_PASSWORD || 'password123';
  const existingStudent = await prisma.user.findUnique({
    where: { email: studentEmail },
  });

  if (!existingStudent) {
    const hashedStudentPassword = await bcrypt.hash(studentPassword, saltRounds);
    const student = await prisma.user.create({
      data: {
        name: 'Test Student',
        email: studentEmail,
        password: hashedStudentPassword,
        role: Role.STUDENT,
        status: UserStatus.ACTIVE,
      },
    });
    console.log(`✓ Student created successfully: ${student.email}`);
  } else {
    console.log(`ℹ Student already exists: ${existingStudent.email}`);
  }
};

// Execute when invoked directly from CLI (e.g., npm run seed)
if (require.main === module) {
  seedSuperAdmin()
    .catch((e) => {
      console.error('✗ Error during seeding:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
