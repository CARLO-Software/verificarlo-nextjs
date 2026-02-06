/*
  Warnings:

  - You are about to drop the column `inspectionId` on the `booking` table. All the data in the column will be lost.
  - You are about to drop the column `brand_id` on the `model` table. All the data in the column will be lost.
  - You are about to drop the column `year_from` on the `model` table. All the data in the column will be lost.
  - You are about to drop the column `year_to` on the `model` table. All the data in the column will be lost.
  - The primary key for the `user` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `inspection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `inspectionitem` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[brandId,name]` on the table `Model` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `inspectionPlanId` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `brandId` to the `Model` table without a default value. This is not possible if the table is not empty.
  - Added the required column `yearFrom` to the `Model` table without a default value. This is not possible if the table is not empty.
  - Added the required column `yearTo` to the `Model` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `account` DROP FOREIGN KEY `Account_userId_fkey`;

-- DropForeignKey
ALTER TABLE `blockeddate` DROP FOREIGN KEY `BlockedDate_createdBy_fkey`;

-- DropForeignKey
ALTER TABLE `booking` DROP FOREIGN KEY `Booking_clientId_fkey`;

-- DropForeignKey
ALTER TABLE `booking` DROP FOREIGN KEY `Booking_inspectionId_fkey`;

-- DropForeignKey
ALTER TABLE `booking` DROP FOREIGN KEY `Booking_inspectorId_fkey`;

-- DropForeignKey
ALTER TABLE `inspectionitem` DROP FOREIGN KEY `InspectionItem_inspection_id_fkey`;

-- DropForeignKey
ALTER TABLE `model` DROP FOREIGN KEY `Model_brand_id_fkey`;

-- DropForeignKey
ALTER TABLE `session` DROP FOREIGN KEY `Session_userId_fkey`;

-- DropForeignKey
ALTER TABLE `vehicle` DROP FOREIGN KEY `Vehicle_userId_fkey`;

-- DropIndex
DROP INDEX `Model_brand_id_name_key` ON `model`;

-- AlterTable
ALTER TABLE `account` MODIFY `userId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `blockeddate` MODIFY `createdBy` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `booking` DROP COLUMN `inspectionId`,
    ADD COLUMN `inspectionPlanId` INTEGER NOT NULL,
    MODIFY `clientId` VARCHAR(191) NOT NULL,
    MODIFY `inspectorId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `model` DROP COLUMN `brand_id`,
    DROP COLUMN `year_from`,
    DROP COLUMN `year_to`,
    ADD COLUMN `brandId` INTEGER NOT NULL,
    ADD COLUMN `yearFrom` INTEGER NOT NULL,
    ADD COLUMN `yearTo` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `session` MODIFY `userId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `user` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `vehicle` MODIFY `userId` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `inspection`;

-- DropTable
DROP TABLE `inspectionitem`;

-- CreateTable
CREATE TABLE `InspectionPlan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('legal', 'basica', 'completa') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `price` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InspectionPlanItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `inspectionPlanId` INTEGER NOT NULL,
    `label` VARCHAR(191) NOT NULL,

    INDEX `InspectionPlanItem_inspectionPlanId_idx`(`inspectionPlanId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InspectionReport` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bookingId` INTEGER NOT NULL,
    `legalStatus` ENUM('PENDING', 'OK', 'WARNING', 'CRITICAL') NOT NULL DEFAULT 'PENDING',
    `legalScore` INTEGER NULL,
    `legalObservations` JSON NULL,
    `mechanicalStatus` ENUM('PENDING', 'OK', 'WARNING', 'CRITICAL') NOT NULL DEFAULT 'PENDING',
    `mechanicalScore` INTEGER NULL,
    `mechanicalObservations` JSON NULL,
    `bodyStatus` ENUM('PENDING', 'OK', 'WARNING', 'CRITICAL') NOT NULL DEFAULT 'PENDING',
    `bodyScore` INTEGER NULL,
    `bodyObservations` JSON NULL,
    `mileageAtInspection` INTEGER NULL,
    `vinNumber` VARCHAR(17) NULL,
    `engineNumber` VARCHAR(191) NULL,
    `actualColor` VARCHAR(191) NULL,
    `overallScore` INTEGER NULL,
    `overallStatus` ENUM('PENDING', 'OK', 'WARNING', 'CRITICAL') NOT NULL DEFAULT 'PENDING',
    `executiveSummary` TEXT NULL,
    `recommendations` TEXT NULL,
    `estimatedRepairCost` DECIMAL(10, 2) NULL,
    `ownershipCardVerified` BOOLEAN NOT NULL DEFAULT false,
    `soatValid` BOOLEAN NOT NULL DEFAULT false,
    `soatExpiryDate` DATE NULL,
    `technicalReviewValid` BOOLEAN NOT NULL DEFAULT false,
    `technicalReviewExpiryDate` DATE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `completedAt` DATETIME(3) NULL,
    `inspectorSignature` VARCHAR(191) NULL,
    `pdfUrl` VARCHAR(191) NULL,
    `pdfHash` VARCHAR(191) NULL,

    UNIQUE INDEX `InspectionReport_bookingId_key`(`bookingId`),
    INDEX `InspectionReport_bookingId_idx`(`bookingId`),
    INDEX `InspectionReport_overallStatus_idx`(`overallStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InspectionPhoto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reportId` INTEGER NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `thumbnailUrl` VARCHAR(191) NULL,
    `category` ENUM('EXTERIOR_FRONT', 'EXTERIOR_BACK', 'EXTERIOR_LEFT', 'EXTERIOR_RIGHT', 'INTERIOR_DASHBOARD', 'INTERIOR_SEATS', 'INTERIOR_TRUNK', 'ENGINE', 'TIRES', 'DOCUMENTS', 'DAMAGE', 'OTHER') NOT NULL,
    `label` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `InspectionPhoto_reportId_idx`(`reportId`),
    INDEX `InspectionPhoto_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Model_brandId_idx` ON `Model`(`brandId`);

-- CreateIndex
CREATE UNIQUE INDEX `Model_brandId_name_key` ON `Model`(`brandId`, `name`);

-- AddForeignKey
ALTER TABLE `Account` ADD CONSTRAINT `Account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InspectionPlanItem` ADD CONSTRAINT `InspectionPlanItem_inspectionPlanId_fkey` FOREIGN KEY (`inspectionPlanId`) REFERENCES `InspectionPlan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Model` ADD CONSTRAINT `Model_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vehicle` ADD CONSTRAINT `Vehicle_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_inspectorId_fkey` FOREIGN KEY (`inspectorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_inspectionPlanId_fkey` FOREIGN KEY (`inspectionPlanId`) REFERENCES `InspectionPlan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InspectionReport` ADD CONSTRAINT `InspectionReport_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InspectionPhoto` ADD CONSTRAINT `InspectionPhoto_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `InspectionReport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BlockedDate` ADD CONSTRAINT `BlockedDate_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
