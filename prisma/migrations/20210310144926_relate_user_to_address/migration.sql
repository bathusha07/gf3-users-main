-- CreateTable
CREATE TABLE `user_address` (
    `user_id` VARCHAR(36) NOT NULL,
    `address_id` INTEGER NOT NULL,
    `is_default` BOOLEAN NOT NULL,

    PRIMARY KEY (`user_id`,`address_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_address` ADD FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_address` ADD FOREIGN KEY (`address_id`) REFERENCES `address`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
