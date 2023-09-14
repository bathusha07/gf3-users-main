-- CreateTable
CREATE TABLE `address` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `address_line_1` TINYTEXT NOT NULL,
    `address_line_2` TINYTEXT,
    `company` TINYTEXT,
    `city` TINYTEXT NOT NULL,
    `province` VARCHAR(2) NOT NULL,
    `country` VARCHAR(2) NOT NULL,
    `postal_code` VARCHAR(7) NOT NULL,
    `fsa` VARCHAR(3) NOT NULL,
    `special_instructions` TEXT,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
