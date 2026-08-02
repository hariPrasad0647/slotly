-- DropForeignKey
ALTER TABLE `booking` DROP FOREIGN KEY `Booking_slotId_fkey`;

-- DropIndex
DROP INDEX `Booking_slotId_key` ON `booking`;

-- CreateIndex
CREATE INDEX `Booking_slotId_idx` ON `Booking`(`slotId`);

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_slotId_fkey` FOREIGN KEY (`slotId`) REFERENCES `Slot`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
