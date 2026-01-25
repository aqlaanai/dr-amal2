/*
  Warnings:

  - Added the required column `tenantId` to the `AuditLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `ClinicalNote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `ImagingOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `LabResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `LiveSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Patient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Prescription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'clinic_default';

-- AlterTable
ALTER TABLE "ClinicalNote" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'clinic_default';

-- AlterTable
ALTER TABLE "ImagingOrder" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'clinic_default';

-- AlterTable
ALTER TABLE "LabResult" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'clinic_default';

-- AlterTable
ALTER TABLE "LiveSession" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'clinic_default';

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'clinic_default';

-- AlterTable
ALTER TABLE "Prescription" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'clinic_default';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tenantId" TEXT NOT NULL DEFAULT 'clinic_default';

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");

-- CreateIndex
CREATE INDEX "ClinicalNote_tenantId_idx" ON "ClinicalNote"("tenantId");

-- CreateIndex
CREATE INDEX "ImagingOrder_tenantId_idx" ON "ImagingOrder"("tenantId");

-- CreateIndex
CREATE INDEX "LabResult_tenantId_idx" ON "LabResult"("tenantId");

-- CreateIndex
CREATE INDEX "LiveSession_tenantId_idx" ON "LiveSession"("tenantId");

-- CreateIndex
CREATE INDEX "Patient_tenantId_idx" ON "Patient"("tenantId");

-- CreateIndex
CREATE INDEX "Prescription_tenantId_idx" ON "Prescription"("tenantId");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");
