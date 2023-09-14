/*
  Warnings:

  - The migration will change the primary key for the `address` table. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `country` on the `address` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `address` table. The data in that column could be lost. The data in that column will be cast from `Int` to `UnsignedInt`.
  - Added the required column `country_code` to the `address` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `address` DROP PRIMARY KEY,
    DROP COLUMN `country`,
    ADD COLUMN     `country_code` VARCHAR(2) NOT NULL,
    MODIFY `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    MODIFY `address_line_1` VARCHAR(255) NOT NULL,
    MODIFY `address_line_2` VARCHAR(255),
    MODIFY `company` VARCHAR(255),
    MODIFY `city` VARCHAR(255) NOT NULL,
    MODIFY `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    MODIFY `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `province` MODIFY `name` VARCHAR(255) NOT NULL,
    MODIFY `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    MODIFY `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE `user` MODIFY `email` VARCHAR(255),
    MODIFY `first_name` VARCHAR(255),
    MODIFY `last_name` VARCHAR(255),
    MODIFY `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    MODIFY `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
