import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'provider@test.com'
  const password = 'password123'
  
  // Hash password
  const passwordHash = await bcrypt.hash(password, 12)
  
  // Create user
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      tenantId: 'test-tenant-001',
      email,
      passwordHash,
      role: 'provider',
      accountStatus: 'active',
      firstName: 'Test',
      lastName: 'Provider',
    },
  })
  
  console.log('✅ Test user created!')
  console.log('Email:', email)
  console.log('Password:', password)
  console.log('Role:', user.role)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
