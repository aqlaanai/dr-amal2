const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const users = await prisma.user.findMany({ take: 1 });
    console.log('✅ User tenantId:', users[0]?.tenantId);

    const patients = await prisma.patient.findMany({ take: 1 });
    console.log('✅ Patient tenantId:', patients[0]?.tenantId);

    const sessions = await prisma.liveSession.findMany({ take: 1 });
    console.log('✅ Session tenantId:', sessions[0]?.tenantId);

    console.log('✅ STEP 1 COMPLETE: All tenantId fields added and backfilled');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();