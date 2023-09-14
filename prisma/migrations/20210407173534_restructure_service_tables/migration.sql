/*
  Warnings:

  - You are about to drop the `service` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `service_frequency` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `service_price` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `service_frequency` DROP FOREIGN KEY `service_frequency_ibfk_1`;

-- DropForeignKey
ALTER TABLE `service_price` DROP FOREIGN KEY `service_price_ibfk_2`;

-- DropForeignKey
ALTER TABLE `service_price` DROP FOREIGN KEY `service_price_ibfk_1`;

-- AlterTable
ALTER TABLE `address` MODIFY `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    MODIFY `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE `card` MODIFY `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    MODIFY `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE `province` MODIFY `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    MODIFY `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE `stripe_customer` MODIFY `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    MODIFY `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE `subscription` MODIFY `subscription_type` ENUM('MEMBERSHIP', 'SCHEDULED', 'PRODUCT') NOT NULL,
    MODIFY `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    MODIFY `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE `user` MODIFY `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    MODIFY `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE `membership` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `trial_type` ENUM('DAY', 'MONTH', 'YEAR') NOT NULL,
    `trial_value` INTEGER NOT NULL,
    `frequency_type` ENUM('DAY', 'MONTH', 'YEAR') NOT NULL,
    `frequency_value` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP(0),
UNIQUE INDEX `membership.id_unique`(`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `membership_price` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `membership_id` VARCHAR(36) NOT NULL,
    `province_code` VARCHAR(2) NOT NULL,
    `price` FLOAT NOT NULL,
    `tax_code` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- DropTable
DROP TABLE `service`;

-- DropTable
DROP TABLE `service_frequency`;

-- DropTable
DROP TABLE `service_price`;

-- AddForeignKey
ALTER TABLE `membership_price` ADD FOREIGN KEY (`membership_id`) REFERENCES `membership`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `membership_price` ADD FOREIGN KEY (`province_code`) REFERENCES `province`(`code`) ON DELETE CASCADE ON UPDATE CASCADE;
