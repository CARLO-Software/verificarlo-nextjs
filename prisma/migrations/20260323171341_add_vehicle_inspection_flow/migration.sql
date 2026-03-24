-- CreateEnum
CREATE TYPE "LegalStatus" AS ENUM ('BLOQUEADO', 'PENDIENTE', 'EN_PROCESO', 'COMPLETADO');

-- CreateEnum
CREATE TYPE "MechanicalStatus" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'COMPLETADO');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NUEVA_INSPECCION', 'LEGAL_DESBLOQUEADO', 'MECANICO_ASIGNADO', 'INSPECCION_COMPLETADA');

-- CreateTable
CREATE TABLE "VehicleInspection" (
    "id" SERIAL NOT NULL,
    "vehicleId" INTEGER NOT NULL,
    "clientId" TEXT NOT NULL,
    "plate" TEXT,
    "assignedAdminId" TEXT,
    "assignedMechanicId" TEXT,
    "legalStatus" "LegalStatus" NOT NULL,
    "mechanicalStatus" "MechanicalStatus" NOT NULL DEFAULT 'PENDIENTE',
    "legalNotes" TEXT,
    "mechanicNotes" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "plateAddedAt" TIMESTAMP(3),
    "legalUnlockedAt" TIMESTAMP(3),
    "legalStartedAt" TIMESTAMP(3),
    "legalCompletedAt" TIMESTAMP(3),
    "mechanicAssignedAt" TIMESTAMP(3),
    "mechanicStartedAt" TIMESTAMP(3),
    "mechanicCompletedAt" TIMESTAMP(3),

    CONSTRAINT "VehicleInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "inspectionId" INTEGER,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VehicleInspection_legalStatus_idx" ON "VehicleInspection"("legalStatus");

-- CreateIndex
CREATE INDEX "VehicleInspection_mechanicalStatus_idx" ON "VehicleInspection"("mechanicalStatus");

-- CreateIndex
CREATE INDEX "VehicleInspection_clientId_idx" ON "VehicleInspection"("clientId");

-- CreateIndex
CREATE INDEX "VehicleInspection_assignedAdminId_idx" ON "VehicleInspection"("assignedAdminId");

-- CreateIndex
CREATE INDEX "VehicleInspection_assignedMechanicId_idx" ON "VehicleInspection"("assignedMechanicId");

-- CreateIndex
CREATE INDEX "VehicleInspection_createdAt_idx" ON "VehicleInspection"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- AddForeignKey
ALTER TABLE "VehicleInspection" ADD CONSTRAINT "VehicleInspection_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleInspection" ADD CONSTRAINT "VehicleInspection_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleInspection" ADD CONSTRAINT "VehicleInspection_assignedAdminId_fkey" FOREIGN KEY ("assignedAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleInspection" ADD CONSTRAINT "VehicleInspection_assignedMechanicId_fkey" FOREIGN KEY ("assignedMechanicId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "VehicleInspection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
