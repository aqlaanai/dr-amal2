import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'shadi_f4r@yahoo.com'
  
  const user = await prisma.user.findUnique({
    where: { email }
  })
  
  if (!user) {
    console.log('❌ User not found')
    return
  }
  
  console.log('✅ User found:')
  console.log('ID:', user.id)
  console.log('Email:', user.email)
  console.log('Role:', user.role)
  console.log('Account Status:', user.accountStatus)
  console.log('Password Hash:', user.passwordHash.substring(0, 20) + '...')
  
  // Test password
  const testPassword = 'password123'
  const isValid = await bcrypt.compare(testPassword, user.passwordHash)
  console.log('\nTesting password "password123":', isValid ? '✅ VALID' : '❌ INVALID')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
