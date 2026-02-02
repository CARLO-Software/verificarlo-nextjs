-- DropIndex
DROP INDEX `Vehicle_plate_idx` ON `vehicle`;

-- AlterTable
ALTER TABLE `vehicle` MODIFY `plate` VARCHAR(191) NULL;
