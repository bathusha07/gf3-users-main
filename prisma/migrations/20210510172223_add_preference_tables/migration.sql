-- CreateTable
CREATE TABLE `preference` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(255) NOT NULL,
    `label` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,
    `deleted_at` TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscription_preference` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `subscription_id` VARCHAR(36) NOT NULL,
    `preference_id` INTEGER UNSIGNED NOT NULL,
    `is_wanted` BOOLEAN NOT NULL,
UNIQUE INDEX `subscription_preference_subscription_preference_unique`(`subscription_id`, `preference_id`),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `subscription_preference` ADD FOREIGN KEY (`subscription_id`) REFERENCES `subscription`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscription_preference` ADD FOREIGN KEY (`preference_id`) REFERENCES `preference`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
