-- AlterTable
ALTER TABLE `address`
ADD COLUMN `building_type` VARCHAR(255) NULL AFTER `fsa`,
CHANGE COLUMN `user_id` `user_id` VARCHAR(36) NOT NULL AFTER `id`,
CHANGE COLUMN `province_code` `province_code` VARCHAR(2) NOT NULL AFTER `city`,
CHANGE COLUMN `country_code` `country_code` VARCHAR(2) NOT NULL DEFAULT 'CA' AFTER `province_code`;


-- AlterTable
ALTER TABLE `user`
CHANGE COLUMN `firebase_id` `firebase_id` VARCHAR(28) NOT NULL AFTER `id`,
CHANGE COLUMN `phone` `phone` VARCHAR(50) NULL DEFAULT NULL AFTER `email`,
ADD COLUMN `language` VARCHAR(5) NOT NULL DEFAULT 'en' AFTER `last_name`;
