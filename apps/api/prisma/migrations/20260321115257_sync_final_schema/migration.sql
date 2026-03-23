/*
  Warnings:

  - The values [RESOLVED] on the enum `MaintenanceStatus` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[invoiceNumber]` on the table `RentInvoice` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `invoiceNumber` to the `RentInvoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `period` to the `RentInvoice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MaintenanceStatus_new" AS ENUM ('SUBMITTED', 'IN_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
ALTER TABLE "public"."MaintenanceRequest" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "MaintenanceRequest" ALTER COLUMN "status" TYPE "MaintenanceStatus_new" USING ("status"::text::"MaintenanceStatus_new");
ALTER TYPE "MaintenanceStatus" RENAME TO "MaintenanceStatus_old";
ALTER TYPE "MaintenanceStatus_new" RENAME TO "MaintenanceStatus";
DROP TYPE "public"."MaintenanceStatus_old";
ALTER TABLE "MaintenanceRequest" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';
COMMIT;

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'REFUNDED';

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "ownerId" TEXT;

-- AlterTable
ALTER TABLE "RentInvoice" ADD COLUMN     "invoiceNumber" TEXT NOT NULL,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "period" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "RentalAgreement" ADD COLUMN     "depositPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "gracePeriodDays" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "lateFeeAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lateFeePercent" DOUBLE PRECISION,
ADD COLUMN     "paymentDueDay" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Renter" ADD COLUMN     "email" TEXT,
ADD COLUMN     "idType" TEXT NOT NULL DEFAULT 'NATIONAL_ID';

-- CreateTable
CREATE TABLE "Owner" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Owner_email_key" ON "Owner"("email");

-- CreateIndex
CREATE INDEX "Owner_tenantId_idx" ON "Owner"("tenantId");

-- CreateIndex
CREATE INDEX "Disbursement_ownerId_idx" ON "Disbursement"("ownerId");

-- CreateIndex
CREATE INDEX "Property_ownerId_idx" ON "Property"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "RentInvoice_invoiceNumber_key" ON "RentInvoice"("invoiceNumber");

-- AddForeignKey
ALTER TABLE "Owner" ADD CONSTRAINT "Owner_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disbursement" ADD CONSTRAINT "Disbursement_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
