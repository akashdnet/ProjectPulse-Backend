import dotenv from 'dotenv';
dotenv.config();

import prisma from './app/utils/prisma';

async function main() {
  console.log('--- Database Connection Test ---');
  console.log('Database URL target:', process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]*@/, ':****@') : 'Not defined');

  try {
    const startTime = Date.now();
    await prisma.$connect();
    const duration = Date.now() - startTime;
    console.log(`✅ Successfully connected to database in ${duration}ms!`);

    const dbInfo: any = await prisma.$queryRaw`SELECT current_database(), current_user, version()`;
    console.log('📊 Database Info:', dbInfo);

    const users = await prisma.user.findMany({
      select: { name: true, email: true, role: true, status: true },
    });
    console.log('👥 Users in DB:', users);
    const submissionCount = await prisma.submission.count();
    console.log(`📝 Submissions count in DB: ${submissionCount}`);

    console.log('🎉 Database is fully reachable and operational!');
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
  } finally {
    await prisma.$disconnect();
    console.log('--- Test Completed ---');
  }
}

main();
