/*
  Warnings:

  - You are about to drop the column `providerAccountId` on the `account` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `account` table. All the data in the column will be lost.
  - You are about to drop the column `brandId` on the `model` table. All the data in the column will be lost.
  - You are about to drop the column `yearFrom` on the `model` table. All the data in the column will be lost.
  - You are about to drop the column `yearTo` on the `model` table. All the data in the column will be lost.
  - You are about to drop the column `sessionToken` on the `session` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `session` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `fullName` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `agenda` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `inspeccion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `inspeccionitem` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[provider,provider_account_id]` on the table `Account` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[session_token]` on the table `Session` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `provider_account_id` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `brand_id` to the `Model` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year_from` to the `Model` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year_to` to the `Model` table without a default value. This is not possible if the table is not empty.
  - Added the required column `session_token` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `full_name` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `account` DROP FOREIGN KEY `Account_userId_fkey`;

-- DropForeignKey
ALTER TABLE `agenda` DROP FOREIGN KEY `Agenda_inspeccionId_fkey`;

-- DropForeignKey
ALTER TABLE `agenda` DROP FOREIGN KEY `Agenda_modelId_fkey`;

-- DropForeignKey
ALTER TABLE `agenda` DROP FOREIGN KEY `Agenda_userId_fkey`;

-- DropForeignKey
ALTER TABLE `inspeccionitem` DROP FOREIGN KEY `InspeccionItem_inspeccionId_fkey`;

-- DropForeignKey
ALTER TABLE `model` DROP FOREIGN KEY `Model_brandId_fkey`;

-- DropForeignKey
ALTER TABLE `session` DROP FOREIGN KEY `Session_userId_fkey`;

-- DropIndex
DROP INDEX `Account_provider_providerAccountId_key` ON `account`;

-- DropIndex
DROP INDEX `Session_sessionToken_key` ON `session`;

-- AlterTable
ALTER TABLE `account` DROP COLUMN `providerAccountId`,
    DROP COLUMN `userId`,
    ADD COLUMN `provider_account_id` VARCHAR(191) NOT NULL,
    ADD COLUMN `user_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `model` DROP COLUMN `brandId`,
    DROP COLUMN `yearFrom`,
    DROP COLUMN `yearTo`,
    ADD COLUMN `brand_id` INTEGER NOT NULL,
    ADD COLUMN `year_from` INTEGER NOT NULL,
    ADD COLUMN `year_to` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `session` DROP COLUMN `sessionToken`,
    DROP COLUMN `userId`,
    ADD COLUMN `session_token` VARCHAR(191) NOT NULL,
    ADD COLUMN `user_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `createdAt`,
    DROP COLUMN `fullName`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `full_name` VARCHAR(191) NOT NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL;

-- DropTable
DROP TABLE `agenda`;

-- DropTable
DROP TABLE `inspeccion`;

-- DropTable
DROP TABLE `inspeccionitem`;

-- CreateTable
CREATE TABLE `Inspection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('LEGAL', 'BASIC', 'COMPLETE') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `price` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InspectionItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `inspection_id` INTEGER NOT NULL,
    `label` VARCHAR(191) NOT NULL,

    INDEX `InspectionItem_inspection_id_idx`(`inspection_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Schedule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `model_id` INTEGER NOT NULL,
    `inspection_id` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `mileage` INTEGER NOT NULL,
    `plate` VARCHAR(191) NOT NULL,
    `date_time` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `Schedule_user_id_idx`(`user_id`),
    INDEX `Schedule_model_id_idx`(`model_id`),
    INDEX `Schedule_inspection_id_idx`(`inspection_id`),
    INDEX `Schedule_date_time_idx`(`date_time`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Account_provider_provider_account_id_key` ON `Account`(`provider`, `provider_account_id`);

-- CreateIndex
CREATE INDEX `Model_brand_id_idx` ON `Model`(`brand_id`);

-- CreateIndex
CREATE UNIQUE INDEX `Session_session_token_key` ON `Session`(`session_token`);

-- AddForeignKey
ALTER TABLE `Account` ADD CONSTRAINT `Account_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InspectionItem` ADD CONSTRAINT `InspectionItem_inspection_id_fkey` FOREIGN KEY (`inspection_id`) REFERENCES `Inspection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Model` ADD CONSTRAINT `Model_brand_id_fkey` FOREIGN KEY (`brand_id`) REFERENCES `Brand`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Schedule` ADD CONSTRAINT `Schedule_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Schedule` ADD CONSTRAINT `Schedule_model_id_fkey` FOREIGN KEY (`model_id`) REFERENCES `Model`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Schedule` ADD CONSTRAINT `Schedule_inspection_id_fkey` FOREIGN KEY (`inspection_id`) REFERENCES `Inspection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
