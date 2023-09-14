/*
  Warnings:

  - You are about to alter the column `stripe_customer_id` on the `card` table. The data in that column could be lost. The data in that column will be cast from `VarChar(36)` to `VarChar(18)`.
  - You are about to drop the column `id` on the `stripe_customer` table. All the data in the column will be lost.
  - You are about to drop the column `stripe_id` on the `stripe_customer` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stripe_customer_id]` on the table `stripe_customer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `stripe_customer_id` to the `stripe_customer` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `card` DROP FOREIGN KEY `card_ibfk_1`;

-- DropIndex
DROP INDEX `stripe_customer.stripe_id_unique` ON `stripe_customer`;

-- DropIndex
DROP INDEX `stripe_customer.id_unique` ON `stripe_customer`;

-- AlterTable
ALTER TABLE `card` MODIFY `stripe_customer_id` VARCHAR(18) NOT NULL;

-- AlterTable
ALTER TABLE `stripe_customer` DROP COLUMN `id`,
    DROP COLUMN `stripe_id`,
    ADD COLUMN     `stripe_customer_id` VARCHAR(18) NOT NULL,
    ADD PRIMARY KEY (`user_id`);

-- CreateIndex
CREATE UNIQUE INDEX `stripe_customer.stripe_customer_id_unique` ON `stripe_customer`(`stripe_customer_id`);

-- AddForeignKey
ALTER TABLE `card` ADD FOREIGN KEY (`stripe_customer_id`) REFERENCES `stripe_customer`(`stripe_customer_id`) ON DELETE CASCADE ON UPDATE CASCADE;
