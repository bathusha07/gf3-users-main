-- AlterTable
ALTER TABLE `card` ADD COLUMN `stripe_card_fingerprint` VARCHAR(16);

-- CreateIndex
CREATE INDEX `card.stripe_card_fingerprint_index` ON `card`(`stripe_card_fingerprint`);
