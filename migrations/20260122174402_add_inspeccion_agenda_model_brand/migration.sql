-- CreateTable
CREATE TABLE `Inspeccion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` ENUM('LEGAL', 'BASICA', 'COMPLETA') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `price` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InspeccionItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `inspeccionId` INTEGER NOT NULL,
    `label` VARCHAR(191) NOT NULL,

    INDEX `InspeccionItem_inspeccionId_idx`(`inspeccionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Brand` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `logo` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Model` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `brandId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `logo` VARCHAR(191) NOT NULL,
    `yearFrom` INTEGER NOT NULL,
    `yearTo` INTEGER NOT NULL,

    INDEX `Model_brandId_idx`(`brandId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Agenda` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `modelId` INTEGER NOT NULL,
    `inspeccionId` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `mileage` INTEGER NOT NULL,
    `placa` VARCHAR(191) NOT NULL,
    `fechaHora` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Agenda_userId_idx`(`userId`),
    INDEX `Agenda_modelId_idx`(`modelId`),
    INDEX `Agenda_inspeccionId_idx`(`inspeccionId`),
    INDEX `Agenda_fechaHora_idx`(`fechaHora`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `InspeccionItem` ADD CONSTRAINT `InspeccionItem_inspeccionId_fkey` FOREIGN KEY (`inspeccionId`) REFERENCES `Inspeccion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Model` ADD CONSTRAINT `Model_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Agenda` ADD CONSTRAINT `Agenda_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Agenda` ADD CONSTRAINT `Agenda_modelId_fkey` FOREIGN KEY (`modelId`) REFERENCES `Model`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Agenda` ADD CONSTRAINT `Agenda_inspeccionId_fkey` FOREIGN KEY (`inspeccionId`) REFERENCES `Inspeccion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
