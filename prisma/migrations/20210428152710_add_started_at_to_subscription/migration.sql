-- AlterTable
ALTER TABLE `subscription` ADD COLUMN     `started_at` DATETIME(3) NOT NULL,
    MODIFY `next_cycle` DATETIME(3);
