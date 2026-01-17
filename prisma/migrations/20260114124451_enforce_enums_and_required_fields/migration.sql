/*
  Warnings:

  - You are about to drop the `AiInteraction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Referral` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `actorRole` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `ipAddress` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `aiAssisted` on the `ClinicalNote` table. All the data in the column will be lost.
  - You are about to drop the column `orderedAt` on the `LabResult` table. All the data in the column will be lost.
  - You are about to drop the column `receivedAt` on the `LabResult` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedAt` on the `LabResult` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedBy` on the `LabResult` table. All the data in the column will be lost.
  - You are about to drop the column `testType` on the `LabResult` table. All the data in the column will be lost.
  - You are about to drop the column `fullName` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `refreshToken` on the `User` table. All the data in the column will be lost.
  - Added the required column `firstName` to the `Patient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `Patient` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "AiInteraction_accepted_createdAt_idx";

-- DropIndex
DROP INDEX "AiInteraction_contextType_contextId_idx";

-- DropIndex
DROP INDEX "AiInteraction_userId_createdAt_idx";

-- DropIndex
DROP INDEX "Referral_urgency_status_idx";

-- DropIndex
DROP INDEX "Referral_referringProviderId_createdAt_idx";

-- DropIndex
DROP INDEX "Referral_patientId_status_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AiInteraction";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Referral";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT,
    CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AuditLog" ("action", "actorId", "entityId", "entityType", "id", "metadata", "timestamp") SELECT "action", "actorId", "entityId", "entityType", "id", "metadata", "timestamp" FROM "AuditLog";
DROP TABLE "AuditLog";
ALTER TABLE "new_AuditLog" RENAME TO "AuditLog";
CREATE INDEX "AuditLog_actorId_timestamp_idx" ON "AuditLog"("actorId", "timestamp");
CREATE INDEX "AuditLog_entityType_entityId_timestamp_idx" ON "AuditLog"("entityType", "entityId", "timestamp");
CREATE INDEX "AuditLog_action_timestamp_idx" ON "AuditLog"("action", "timestamp");
CREATE TABLE "new_ClinicalNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "subjective" TEXT,
    "objective" TEXT,
    "assessment" TEXT,
    "plan" TEXT,
    "finalizedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sessionId" TEXT,
    CONSTRAINT "ClinicalNote_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClinicalNote_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LiveSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClinicalNote_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ClinicalNote" ("assessment", "createdAt", "finalizedAt", "id", "objective", "patientId", "plan", "providerId", "sessionId", "status", "subjective", "updatedAt") SELECT "assessment", "createdAt", "finalizedAt", "id", "objective", "patientId", "plan", "providerId", "sessionId", "status", "subjective", "updatedAt" FROM "ClinicalNote";
DROP TABLE "ClinicalNote";
ALTER TABLE "new_ClinicalNote" RENAME TO "ClinicalNote";
CREATE INDEX "ClinicalNote_patientId_status_idx" ON "ClinicalNote"("patientId", "status");
CREATE INDEX "ClinicalNote_providerId_createdAt_idx" ON "ClinicalNote"("providerId", "createdAt");
CREATE INDEX "ClinicalNote_sessionId_idx" ON "ClinicalNote"("sessionId");
CREATE TABLE "new_LabResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "orderedBy" TEXT NOT NULL,
    "resultSummary" TEXT,
    "abnormalFlag" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LabResult_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LabResult_orderedBy_fkey" FOREIGN KEY ("orderedBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_LabResult" ("abnormalFlag", "createdAt", "id", "orderedBy", "patientId", "resultSummary", "status", "updatedAt") SELECT "abnormalFlag", "createdAt", "id", "orderedBy", "patientId", "resultSummary", "status", "updatedAt" FROM "LabResult";
DROP TABLE "LabResult";
ALTER TABLE "new_LabResult" RENAME TO "LabResult";
CREATE INDEX "LabResult_patientId_status_idx" ON "LabResult"("patientId", "status");
CREATE INDEX "LabResult_orderedBy_createdAt_idx" ON "LabResult"("orderedBy", "createdAt");
CREATE TABLE "new_Patient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Patient" ("createdAt", "dateOfBirth", "id", "status", "updatedAt") SELECT "createdAt", "dateOfBirth", "id", "status", "updatedAt" FROM "Patient";
DROP TABLE "Patient";
ALTER TABLE "new_Patient" RENAME TO "Patient";
CREATE INDEX "Patient_firstName_idx" ON "Patient"("firstName");
CREATE INDEX "Patient_lastName_idx" ON "Patient"("lastName");
CREATE INDEX "Patient_dateOfBirth_idx" ON "Patient"("dateOfBirth");
CREATE INDEX "Patient_status_idx" ON "Patient"("status");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "accountStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("accountStatus", "createdAt", "email", "id", "passwordHash", "role", "updatedAt") SELECT "accountStatus", "createdAt", "email", "id", "passwordHash", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_accountStatus_idx" ON "User"("accountStatus");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
