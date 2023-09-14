-- AlterTable
ALTER TABLE `address` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `agreement` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `card` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `membership` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `membership_price` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `plan` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `plan_frequency` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `province` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `stripe_customer` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `subscription` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `terms` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `user` ALTER COLUMN `updated_at` DROP DEFAULT;
