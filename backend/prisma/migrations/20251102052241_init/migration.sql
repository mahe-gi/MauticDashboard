-- CreateTable
CREATE TABLE `mautic_clients` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientName` VARCHAR(255) NOT NULL,
    `baseUrl` VARCHAR(255) NOT NULL,
    `clientId` VARCHAR(255) NOT NULL,
    `clientSecret` VARCHAR(255) NOT NULL,
    `accessToken` TEXT NULL,
    `refreshToken` TEXT NULL,
    `tokenExpiresAt` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastSyncAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contacts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientId` INTEGER NOT NULL,
    `mauticContactId` INTEGER NOT NULL,
    `firstName` VARCHAR(255) NULL,
    `lastName` VARCHAR(255) NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(50) NULL,
    `company` VARCHAR(255) NULL,
    `city` VARCHAR(100) NULL,
    `country` VARCHAR(100) NULL,
    `lastActive` DATETIME(3) NULL,
    `points` INTEGER NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `contacts_clientId_idx`(`clientId`),
    UNIQUE INDEX `contacts_clientId_mauticContactId_key`(`clientId`, `mauticContactId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campaigns` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientId` INTEGER NOT NULL,
    `mauticCampaignId` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `totalContacts` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `campaigns_clientId_idx`(`clientId`),
    UNIQUE INDEX `campaigns_clientId_mauticCampaignId_key`(`clientId`, `mauticCampaignId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_stats` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientId` INTEGER NOT NULL,
    `mauticEmailId` INTEGER NOT NULL,
    `subject` VARCHAR(500) NULL,
    `name` VARCHAR(255) NULL,
    `sentCount` INTEGER NOT NULL DEFAULT 0,
    `readCount` INTEGER NOT NULL DEFAULT 0,
    `clickedCount` INTEGER NOT NULL DEFAULT 0,
    `failedCount` INTEGER NOT NULL DEFAULT 0,
    `openRate` DOUBLE NOT NULL DEFAULT 0,
    `clickRate` DOUBLE NOT NULL DEFAULT 0,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `email_stats_clientId_idx`(`clientId`),
    UNIQUE INDEX `email_stats_clientId_mauticEmailId_key`(`clientId`, `mauticEmailId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `contacts` ADD CONSTRAINT `contacts_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `mautic_clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaigns` ADD CONSTRAINT `campaigns_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `mautic_clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_stats` ADD CONSTRAINT `email_stats_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `mautic_clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
