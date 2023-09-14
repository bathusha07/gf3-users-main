-- CreateTable
CREATE TABLE `stripe_customer` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `stripe_id` VARCHAR(18) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP(0),
UNIQUE INDEX `stripe_customer.id_unique`(`id`),
UNIQUE INDEX `stripe_customer.user_id_unique`(`user_id`),
UNIQUE INDEX `stripe_customer.stripe_id_unique`(`stripe_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `card` (
    `id` VARCHAR(36) NOT NULL,
    `stripe_customer_id` VARCHAR(36) NOT NULL,
    `stripe_payment_method_id` VARCHAR(36) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP(0),
UNIQUE INDEX `card.id_unique`(`id`),
UNIQUE INDEX `card.stripe_payment_method_id_unique`(`stripe_payment_method_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `stripe_customer` ADD FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `card` ADD FOREIGN KEY (`stripe_customer_id`) REFERENCES `stripe_customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
