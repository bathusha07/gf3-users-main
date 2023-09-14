/*
  Warnings:

  - A unique constraint covering the columns `[stripe_card_token]` on the table `card` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `card` ADD COLUMN     `stripe_card_token` VARCHAR(36);

-- CreateIndex
CREATE UNIQUE INDEX `card.stripe_card_token_unique` ON `card`(`stripe_card_token`);
