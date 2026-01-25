const { PrismaClient } = require('@prisma/client');
const { generateAccessToken, verifyAccessToken } = require('./src/lib/jwt');

const prisma = new PrismaClient();

async function test() {
  try {
    console.log('🧪 Testing STEP 2: JWT Tenant Context Injection');

    // Get a test user
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('❌ No users found');
      return;
    }

    console.log('✅ Test user:', {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId
    });

    // Generate token with tenantId
    const token = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId
    });

    console.log('✅ Token generated successfully');

    // Verify token includes tenantId
    const decoded = verifyAccessToken(token);
    console.log('✅ Token decoded:', {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      tenantId: decoded.tenantId
    });

    // Verify tenantId is present
    if (!decoded.tenantId) {
      console.log('❌ tenantId missing from token');
      return;
    }

    if (decoded.tenantId !== user.tenantId) {
      console.log('❌ tenantId mismatch:', decoded.tenantId, 'vs', user.tenantId);
      return;
    }

    console.log('✅ STEP 2 COMPLETE: JWT tenant context injection working');
    console.log('   - JWT tokens include tenantId');
    console.log('   - Token verification extracts tenantId');
    console.log('   - tenantId matches user record');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();