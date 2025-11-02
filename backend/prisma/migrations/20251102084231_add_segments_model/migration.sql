/*
  Warnings:

  - You are about to drop the column `active` on the `campaigns` table. All the data in the column will be lost.
  - You are about to drop the column `activeRate` on the `campaigns` table. All the data in the column will be lost.
  - You are about to drop the column `completed` on the `campaigns` table. All the data in the column will be lost.
  - You are about to drop the column `completionRate` on the `campaigns` table. All the data in the column will be lost.
  - You are about to drop the column `pending` on the `campaigns` table. All the data in the column will be lost.
  - You are about to drop the column `bounceCount` on the `email_stats` table. All the data in the column will be lost.
  - You are about to drop the column `bounceRate` on the `email_stats` table. All the data in the column will be lost.
  - You are about to drop the column `clickToOpenRate` on the `email_stats` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryRate` on the `email_stats` table. All the data in the column will be lost.
  - You are about to drop the column `spamCount` on the `email_stats` table. All the data in the column will be lost.
  - You are about to drop the column `unsubscribeRate` on the `email_stats` table. All the data in the column will be lost.
  - You are about to drop the column `unsubscribed` on the `email_stats` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `campaigns` DROP COLUMN `active`,
    DROP COLUMN `activeRate`,
    DROP COLUMN `completed`,
    DROP COLUMN `completionRate`,
    DROP COLUMN `pending`;

-- AlterTable
ALTER TABLE `email_stats` DROP COLUMN `bounceCount`,
    DROP COLUMN `bounceRate`,
    DROP COLUMN `clickToOpenRate`,
    DROP COLUMN `deliveryRate`,
    DROP COLUMN `spamCount`,
    DROP COLUMN `unsubscribeRate`,
    DROP COLUMN `unsubscribed`;

-- CreateTable
CREATE TABLE `segments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientId` INTEGER NOT NULL,
    `mauticSegmentId` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `isGlobal` BOOLEAN NOT NULL DEFAULT false,
    `contactCount` INTEGER NOT NULL DEFAULT 0,
    `createdBy` VARCHAR(255) NULL,
    `dateAdded` DATETIME(3) NULL,
    `dateModified` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `segments_clientId_idx`(`clientId`),
    UNIQUE INDEX `segments_clientId_mauticSegmentId_key`(`clientId`, `mauticSegmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `segments` ADD CONSTRAINT `segments_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `mautic_clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
