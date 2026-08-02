-- AlterTable
ALTER TABLE `availabilityrule` ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `title` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `hostprofile` ADD COLUMN `bannerUrl` TEXT NULL,
    ADD COLUMN `companyLogoUrl` TEXT NULL,
    ADD COLUMN `faqs` JSON NULL,
    ADD COLUMN `timezone` VARCHAR(191) NOT NULL DEFAULT 'UTC';

-- AlterTable
ALTER TABLE `slot` ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `title` VARCHAR(191) NULL;
