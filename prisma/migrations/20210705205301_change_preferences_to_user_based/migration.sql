-- DropForeignKey
ALTER TABLE `subscription_preference` DROP FOREIGN KEY `subscription_preference_ibfk_2`;

-- DropForeignKey
ALTER TABLE `subscription_preference` DROP FOREIGN KEY `subscription_preference_ibfk_1`;

-- AlterTable
ALTER TABLE `preference` DROP COLUMN `code`,
    DROP COLUMN `label`,
    DROP COLUMN `updated_at`,
    DROP COLUMN `deleted_at`,
    ADD COLUMN     `user_id` VARCHAR(36) NOT NULL,
    ADD COLUMN     `subscription_id` VARCHAR(36),
    ADD COLUMN     `preference_code` VARCHAR(36) NOT NULL;

-- DropTable
DROP TABLE `subscription_preference`;

-- AddForeignKey
ALTER TABLE `preference` ADD FOREIGN KEY (`subscription_id`) REFERENCES `subscription`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `preference` ADD FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
