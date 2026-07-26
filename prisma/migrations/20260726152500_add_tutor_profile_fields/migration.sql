-- AlterTable
ALTER TABLE `hostprofile` ADD COLUMN `experienceYears` INTEGER NULL,
    ADD COLUMN `expertise` JSON NULL,
    ADD COLUMN `headline` VARCHAR(191) NULL,
    ADD COLUMN `languages` JSON NULL,
    ADD COLUMN `qualifications` JSON NULL,
    ADD COLUMN `socialLinks` JSON NULL;
