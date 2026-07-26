-- DropForeignKey
ALTER TABLE `zoommeeting` DROP FOREIGN KEY `ZoomMeeting_zoomConnectionId_fkey`;

-- DropIndex
DROP INDEX `ZoomMeeting_zoomConnectionId_fkey` ON `zoommeeting`;

-- AlterTable
ALTER TABLE `zoommeeting` MODIFY `zoomConnectionId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `ZoomMeeting` ADD CONSTRAINT `ZoomMeeting_zoomConnectionId_fkey` FOREIGN KEY (`zoomConnectionId`) REFERENCES `ZoomConnection`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
