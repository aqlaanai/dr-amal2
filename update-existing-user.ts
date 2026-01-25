import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'shadi_f4r@yahoo.com'
  const newPassword = 'password123'
  
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  })
  
  if (!existingUser) {
    console.log('❌ User not found:', email)
    return
  }
  
  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 12)
  
  // Update user password
  await prisma.user.update({
    where: { email },
    data: { passwordHash }
  })
  
  console.log('✅ Password updated for:', email)
  console.log('New password:', newPassword)
  console.log('Role:', existingUser.role)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
