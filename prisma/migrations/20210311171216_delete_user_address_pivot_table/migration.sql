/*
  Warnings:

  - You are about to drop the `user_address` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `user_id` to the `address` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `user_address` DROP FOREIGN KEY `user_address_ibfk_2`;

-- DropForeignKey
ALTER TABLE `user_address` DROP FOREIGN KEY `user_address_ibfk_1`;

-- AlterTable
ALTER TABLE `address` ADD COLUMN     `user_id` VARCHAR(36) NOT NULL,
    ADD COLUMN     `is_default` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN     `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN     `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ADD COLUMN     `deleted_at` TIMESTAMP(0);

-- AlterTable
ALTER TABLE `province` ADD COLUMN     `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN     `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ADD COLUMN     `deleted_at` TIMESTAMP(0);

-- AlterTable
ALTER TABLE `user` ADD COLUMN     `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN     `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ADD COLUMN     `deleted_at` TIMESTAMP(0),
    MODIFY `email` TINYTEXT,
    MODIFY `first_name` TINYTEXT,
    MODIFY `last_name` TINYTEXT;

-- DropTable
DROP TABLE `user_address`;

-- AddForeignKey
ALTER TABLE `address` ADD FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
