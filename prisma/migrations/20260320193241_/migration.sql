/*
  Warnings:

  - A unique constraint covering the columns `[culqiEventId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CULQI', 'TRANSFER', 'YAPE_PLIN', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "LegalReportStatus" AS ENUM ('PENDING_REVIEW', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "LegalFieldStatus" AS ENUM ('OK', 'WARNING', 'CRITICAL', 'PENDING');

-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'PENDING_VERIFICATION';

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'PENDING_VERIFICATION';

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_clientId_fkey";

-- AlterTable
ALTER TABLE "InspectionPhoto" ADD COLUMN     "checklistItemId" TEXT,
ALTER COLUMN "category" SET DEFAULT 'DAMAGE';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "culqiEventId" TEXT,
ADD COLUMN     "method" "PaymentMethod" NOT NULL DEFAULT 'CULQI',
ADD COLUMN     "operationNumber" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedBy" TEXT,
ADD COLUMN     "voucherUrl" TEXT;

-- CreateTable
CREATE TABLE "LegalReport" (
    "id" SERIAL NOT NULL,
    "reportId" INTEGER NOT NULL,
    "status" "LegalReportStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "ownerHistoryStatus" "LegalFieldStatus" NOT NULL DEFAULT 'PENDING',
    "ownerHistoryText" TEXT,
    "sunarpLiensStatus" "LegalFieldStatus" NOT NULL DEFAULT 'PENDING',
    "sunarpLiensText" TEXT,
    "satCaptureOrderStatus" "LegalFieldStatus" NOT NULL DEFAULT 'PENDING',
    "satCaptureOrderText" TEXT,
    "soatStatus" "LegalFieldStatus" NOT NULL DEFAULT 'PENDING',
    "soatText" TEXT,
    "soatExpiryDate" DATE,
    "techReviewStatus" "LegalFieldStatus" NOT NULL DEFAULT 'PENDING',
    "techReviewText" TEXT,
    "techReviewExpiryDate" DATE,
    "vehicleTaxStatus" "LegalFieldStatus" NOT NULL DEFAULT 'PENDING',
    "vehicleTaxText" TEXT,
    "gasConversionStatus" "LegalFieldStatus" NOT NULL DEFAULT 'PENDING',
    "gasConversionText" TEXT,
    "satTicketsStatus" "LegalFieldStatus" NOT NULL DEFAULT 'PENDING',
    "satTicketsText" TEXT,
    "callaoTicketsStatus" "LegalFieldStatus" NOT NULL DEFAULT 'PENDING',
    "callaoTicketsText" TEXT,
    "sutranTicketsStatus" "LegalFieldStatus" NOT NULL DEFAULT 'PENDING',
    "sutranTicketsText" TEXT,
    "theftHistoryStatus" "LegalFieldStatus" NOT NULL DEFAULT 'PENDING',
    "theftHistoryText" TEXT,
    "transportRegistryStatus" "LegalFieldStatus" NOT NULL DEFAULT 'PENDING',
    "transportRegistryText" TEXT,
    "lastTransferStatus" "LegalFieldStatus" NOT NULL DEFAULT 'PENDING',
    "lastTransferText" TEXT,
    "accidentHistoryStatus" "LegalFieldStatus" NOT NULL DEFAULT 'PENDING',
    "accidentHistoryText" TEXT,
    "otherObservations" TEXT,
    "lockedBy" TEXT,
    "lockedAt" TIMESTAMP(3),
    "lockExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,

    CONSTRAINT "LegalReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LegalReport_reportId_key" ON "LegalReport"("reportId");

-- CreateIndex
CREATE INDEX "LegalReport_reportId_idx" ON "LegalReport"("reportId");

-- CreateIndex
CREATE INDEX "LegalReport_status_idx" ON "LegalReport"("status");

-- CreateIndex
CREATE INDEX "LegalReport_lockedBy_idx" ON "LegalReport"("lockedBy");

-- CreateIndex
CREATE INDEX "InspectionPhoto_checklistItemId_idx" ON "InspectionPhoto"("checklistItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_culqiEventId_key" ON "Payment"("culqiEventId");

-- CreateIndex
CREATE INDEX "Payment_culqiEventId_idx" ON "Payment"("culqiEventId");

-- CreateIndex
CREATE INDEX "Payment_method_idx" ON "Payment"("method");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalReport" ADD CONSTRAINT "LegalReport_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "InspectionReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalReport" ADD CONSTRAINT "LegalReport_lockedBy_fkey" FOREIGN KEY ("lockedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalReport" ADD CONSTRAINT "LegalReport_completedBy_fkey" FOREIGN KEY ("completedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
