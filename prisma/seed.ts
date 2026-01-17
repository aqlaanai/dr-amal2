/**
 * Prisma Seed Script - Dr Amal Clinical OS v2.0
 * Step 4: Controlled & Idempotent Seed Data
 * 
 * Purpose: Populate development database with realistic test data
 * Safety: Idempotent (safe to run multiple times)
 * Scope: Development only - guards against production usage
 */

import { PrismaClient, UserRole, AccountStatus, SessionStatus, ClinicalNoteStatus, PrescriptionStatus, LabResultStatus } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { hashPassword } from '../src/lib/crypto';

// Create better-sqlite3 adapter (required for Prisma 7+)
const adapter = new PrismaBetterSqlite3({ url: './dev.db' });
const prisma = new PrismaClient({ adapter });

// Guard against accidental production seeding
if (process.env.NODE_ENV === 'production') {
  console.error('❌ SEED ABORTED: Cannot run seed script in production environment');
  process.exit(1);
}

/**
 * Clear existing seed data (idempotent)
 * Only removes records created by this seed script
 */
async function clearSeedData() {
  console.log('🧹 Clearing existing seed data...');
  
  // Delete in reverse dependency order
  await prisma.auditLog.deleteMany({
    where: {
      actor: {
        email: { in: ['admin@dramal.com', 'provider@dramal.com', 'parent@dramal.com'] }
      }
    }
  });
  
  await prisma.labResult.deleteMany({
    where: {
      orderingProvider: {
        email: { in: ['admin@dramal.com', 'provider@dramal.com'] }
      }
    }
  });
  
  await prisma.prescription.deleteMany({
    where: {
      provider: {
        email: { in: ['admin@dramal.com', 'provider@dramal.com'] }
      }
    }
  });
  
  await prisma.clinicalNote.deleteMany({
    where: {
      provider: {
        email: { in: ['admin@dramal.com', 'provider@dramal.com'] }
      }
    }
  });
  
  await prisma.liveSession.deleteMany({
    where: {
      provider: {
        email: { in: ['admin@dramal.com', 'provider@dramal.com'] }
      }
    }
  });
  
  await prisma.patient.deleteMany({
    where: {
      lastName: { in: ['Johnson', 'Williams', 'Davis', 'Martinez', 'Anderson'] }
    }
  });
  
  await prisma.user.deleteMany({
    where: {
      email: { in: ['admin@dramal.com', 'provider@dramal.com', 'parent@dramal.com'] }
    }
  });
  
  console.log('✓ Existing seed data cleared');
}

/**
 * Create seed users
 */
async function seedUsers() {
  console.log('\n👤 Creating users...');
  
  const password = 'Test123!';
  const passwordHash = await hashPassword(password);
  
  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@dramal.com',
      passwordHash,
      role: UserRole.admin,
      accountStatus: AccountStatus.active,
    }
  });
  console.log(`  ✓ Admin created: ${admin.email}`);
  
  // Create provider user
  const provider = await prisma.user.create({
    data: {
      email: 'provider@dramal.com',
      passwordHash,
      role: UserRole.provider,
      accountStatus: AccountStatus.active,
    }
  });
  console.log(`  ✓ Provider created: ${provider.email}`);
  
  // Create parent user
  const parent = await prisma.user.create({
    data: {
      email: 'parent@dramal.com',
      passwordHash,
      role: UserRole.parent,
      accountStatus: AccountStatus.active,
    }
  });
  console.log(`  ✓ Parent created: ${parent.email}`);
  
  return { admin, provider, parent };
}

/**
 * Create seed patients
 */
async function seedPatients() {
  console.log('\n👨‍👩‍👧‍👦 Creating patients...');
  
  const patients = await Promise.all([
    // Child patient (5 years old)
    prisma.patient.create({
      data: {
        firstName: 'Emma',
        lastName: 'Johnson',
        dateOfBirth: new Date('2021-03-15'),
        status: 'active',
      }
    }),
    
    // Teenager patient (14 years old)
    prisma.patient.create({
      data: {
        firstName: 'Liam',
        lastName: 'Williams',
        dateOfBirth: new Date('2012-07-22'),
        status: 'active',
      }
    }),
    
    // Young adult patient (22 years old)
    prisma.patient.create({
      data: {
        firstName: 'Sophia',
        lastName: 'Davis',
        dateOfBirth: new Date('2004-11-08'),
        status: 'active',
      }
    }),
    
    // Adult patient (35 years old)
    prisma.patient.create({
      data: {
        firstName: 'Noah',
        lastName: 'Martinez',
        dateOfBirth: new Date('1991-05-30'),
        status: 'active',
      }
    }),
    
    // Archived patient (for testing)
    prisma.patient.create({
      data: {
        firstName: 'Olivia',
        lastName: 'Anderson',
        dateOfBirth: new Date('2015-09-12'),
        status: 'archived',
      }
    }),
  ]);
  
  patients.forEach(p => {
    const age = Math.floor((Date.now() - p.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    console.log(`  ✓ Patient created: ${p.firstName} ${p.lastName} (${age}y, ${p.status})`);
  });
  
  return patients;
}

/**
 * Create seed sessions
 */
async function seedSessions(provider: any, patients: any[]) {
  console.log('\n📅 Creating sessions...');
  
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  const sessions = await Promise.all([
    // Completed session (yesterday)
    prisma.liveSession.create({
      data: {
        patientId: patients[0].id,
        providerId: provider.id,
        status: SessionStatus.completed,
        scheduledAt: yesterday,
        startedAt: new Date(yesterday.getTime() + 5 * 60 * 1000), // 5 min after scheduled
        completedAt: new Date(yesterday.getTime() + 35 * 60 * 1000), // 30 min session
      }
    }),
    
    // Active session (now)
    prisma.liveSession.create({
      data: {
        patientId: patients[1].id,
        providerId: provider.id,
        status: SessionStatus.active,
        scheduledAt: new Date(now.getTime() - 10 * 60 * 1000),
        startedAt: new Date(now.getTime() - 5 * 60 * 1000),
      }
    }),
    
    // Scheduled session (tomorrow)
    prisma.liveSession.create({
      data: {
        patientId: patients[2].id,
        providerId: provider.id,
        status: SessionStatus.scheduled,
        scheduledAt: tomorrow,
      }
    }),
  ]);
  
  sessions.forEach(s => {
    console.log(`  ✓ Session created: ${s.status} for patient ${s.patientId.substring(0, 8)}...`);
  });
  
  return sessions;
}

/**
 * Create seed clinical notes
 */
async function seedClinicalNotes(provider: any, patients: any[], sessions: any[]) {
  console.log('\n📝 Creating clinical notes...');
  
  const notes = await Promise.all([
    // Draft note (editable)
    prisma.clinicalNote.create({
      data: {
        patientId: patients[1].id,
        providerId: provider.id,
        sessionId: sessions[1].id, // Active session
        status: ClinicalNoteStatus.draft,
        subjective: 'Patient reports mild headache for the past 2 days. No fever or nausea.',
        objective: 'BP: 120/80, HR: 72 bpm, Temp: 98.6°F. Alert and oriented.',
        assessment: 'Likely tension headache. No signs of serious pathology.',
        plan: 'Recommend OTC pain relief, adequate hydration, and stress management. Follow-up in 1 week if symptoms persist.',
      }
    }),
    
    // Finalized note (immutable)
    prisma.clinicalNote.create({
      data: {
        patientId: patients[0].id,
        providerId: provider.id,
        sessionId: sessions[0].id, // Completed session
        status: ClinicalNoteStatus.finalized,
        subjective: 'Parent reports child has had runny nose and cough for 3 days. No fever.',
        objective: 'Temp: 98.4°F, HR: 90 bpm. Clear lungs, mild nasal congestion.',
        assessment: 'Upper respiratory tract infection, likely viral.',
        plan: 'Supportive care: rest, fluids, saline nasal drops. Return if fever develops or symptoms worsen.',
        finalizedAt: new Date(sessions[0].completedAt!.getTime() + 10 * 60 * 1000),
      }
    }),
  ]);
  
  notes.forEach(n => {
    console.log(`  ✓ Clinical note created: ${n.status} for patient ${n.patientId.substring(0, 8)}...`);
  });
  
  return notes;
}

/**
 * Create seed prescriptions
 */
async function seedPrescriptions(provider: any, patients: any[]) {
  console.log('\n💊 Creating prescriptions...');
  
  const prescriptions = await Promise.all([
    // Draft prescription
    prisma.prescription.create({
      data: {
        patientId: patients[1].id,
        providerId: provider.id,
        medication: 'Ibuprofen',
        dosage: '400mg',
        duration: '5 days',
        instructions: 'Take one tablet every 6 hours as needed for headache. Take with food.',
        status: PrescriptionStatus.draft,
      }
    }),
    
    // Issued prescription (immutable)
    prisma.prescription.create({
      data: {
        patientId: patients[0].id,
        providerId: provider.id,
        medication: 'Acetaminophen (Pediatric)',
        dosage: '160mg/5ml',
        duration: '3 days',
        instructions: 'Give 5ml (1 teaspoon) by mouth every 4-6 hours as needed for fever. Do not exceed 5 doses in 24 hours.',
        status: PrescriptionStatus.issued,
        issuedAt: new Date(),
      }
    }),
  ]);
  
  prescriptions.forEach(p => {
    console.log(`  ✓ Prescription created: ${p.medication} (${p.status}) for patient ${p.patientId.substring(0, 8)}...`);
  });
  
  return prescriptions;
}

/**
 * Create seed lab results
 */
async function seedLabResults(provider: any, patients: any[]) {
  console.log('\n🔬 Creating lab results...');
  
  const labResults = await Promise.all([
    // Pending lab result
    prisma.labResult.create({
      data: {
        patientId: patients[2].id,
        orderedBy: provider.id,
        status: LabResultStatus.pending,
      }
    }),
    
    // Received lab result (normal)
    prisma.labResult.create({
      data: {
        patientId: patients[0].id,
        orderedBy: provider.id,
        resultSummary: 'CBC: WBC 7.2 k/uL (normal), RBC 4.5 M/uL (normal), Platelets 250 k/uL (normal)',
        abnormalFlag: false,
        status: LabResultStatus.received,
      }
    }),
    
    // Received lab result (abnormal)
    prisma.labResult.create({
      data: {
        patientId: patients[1].id,
        orderedBy: provider.id,
        resultSummary: 'Hemoglobin: 10.2 g/dL (LOW - normal range 12-16 g/dL). Recommend iron supplementation.',
        abnormalFlag: true,
        status: LabResultStatus.reviewed,
      }
    }),
  ]);
  
  labResults.forEach(l => {
    console.log(`  ✓ Lab result created: ${l.status}${l.abnormalFlag ? ' (ABNORMAL)' : ''} for patient ${l.patientId.substring(0, 8)}...`);
  });
  
  return labResults;
}

/**
 * Main seed function
 */
async function main() {
  console.log('🌱 Starting seed process...');
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('');
  
  try {
    // Step 1: Clear existing seed data (idempotent)
    await clearSeedData();
    
    // Step 2: Create users
    const { admin, provider, parent } = await seedUsers();
    
    // Step 3: Create patients
    const patients = await seedPatients();
    
    // Step 4: Create sessions
    const sessions = await seedSessions(provider, patients);
    
    // Step 5: Create clinical notes
    await seedClinicalNotes(provider, patients, sessions);
    
    // Step 6: Create prescriptions
    await seedPrescriptions(provider, patients);
    
    // Step 7: Create lab results
    await seedLabResults(provider, patients);
    
    console.log('\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SEED COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📊 Summary:');
    console.log('  • Users: 3 (admin, provider, parent)');
    console.log('  • Patients: 5 (mixed ages, 1 archived)');
    console.log('  • Sessions: 3 (scheduled, active, completed)');
    console.log('  • Clinical Notes: 2 (1 draft, 1 finalized)');
    console.log('  • Prescriptions: 2 (1 draft, 1 issued)');
    console.log('  • Lab Results: 3 (pending, received, reviewed)');
    console.log('\n🔐 Test Credentials:');
    console.log('  Email: admin@dramal.com | provider@dramal.com | parent@dramal.com');
    console.log('  Password: Test123!');
    console.log('  Status: All accounts ACTIVE (no approval needed)');
    console.log('\n');
    
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    throw error;
  }
}

// Execute seed
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
