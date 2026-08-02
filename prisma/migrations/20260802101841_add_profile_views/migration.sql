-- CreateTable
CREATE TABLE `ProfileView` (
    `id` VARCHAR(191) NOT NULL,
    `hostProfileId` VARCHAR(191) NOT NULL,
    `visitorId` VARCHAR(191) NOT NULL,
    `referrer` TEXT NULL,
    `userAgent` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProfileView_hostProfileId_idx`(`hostProfileId`),
    INDEX `ProfileView_hostProfileId_createdAt_idx`(`hostProfileId`, `createdAt`),
    INDEX `ProfileView_visitorId_idx`(`visitorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProfileView` ADD CONSTRAINT `ProfileView_hostProfileId_fkey` FOREIGN KEY (`hostProfileId`) REFERENCES `HostProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
