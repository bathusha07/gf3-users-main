/*
  Warnings:

  - The primary key for the `address` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `address` table. The data in that column could be lost. The data in that column will be cast from `UnsignedInt` to `VarChar(36)`.
  - You are about to alter the column `address_id` on the `subscription` table. The data in that column could be lost. The data in that column will be cast from `UnsignedInt` to `VarChar(36)`.
  - A unique constraint covering the columns `[id]` on the table `address` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `subscription` DROP FOREIGN KEY `subscription_ibfk_3`;

-- AlterTable
ALTER TABLE `address` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE `subscription` MODIFY `address_id` VARCHAR(36) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `address.id_unique` ON `address`(`id`);

-- AddForeignKey
ALTER TABLE `subscription` ADD FOREIGN KEY (`address_id`) REFERENCES `address`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
