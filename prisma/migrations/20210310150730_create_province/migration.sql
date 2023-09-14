/*
  Warnings:

  - You are about to drop the column `province` on the `address` table. All the data in the column will be lost.
  - Added the required column `province_code` to the `address` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `address` DROP COLUMN `province`,
    ADD COLUMN     `province_code` VARCHAR(2) NOT NULL;

-- CreateTable
CREATE TABLE `province` (
    `code` VARCHAR(2) NOT NULL,
    `name` TINYTEXT NOT NULL,

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `address` ADD FOREIGN KEY (`province_code`) REFERENCES `province`(`code`) ON DELETE CASCADE ON UPDATE CASCADE;
