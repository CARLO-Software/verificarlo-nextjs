/*
  Warnings:

  - You are about to drop the column `isActive` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `isActive`,
    ADD COLUMN `isInspectorAvailable` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `status` ENUM('ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE';
