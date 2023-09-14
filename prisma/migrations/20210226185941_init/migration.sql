/*
  Warnings:

  - The migration will change the primary key for the `user` table. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `name` on the `user` table. All the data in the column will be lost.
  - The migration will add a unique constraint covering the columns `[id]` on the table `user`. If there are existing duplicate values, the migration will fail.

*/
-- DropIndex
DROP INDEX `user.email_unique` ON `user`;

-- AlterTable
ALTER TABLE `user` DROP PRIMARY KEY,
    DROP COLUMN `name`,
    ADD COLUMN     `first_name` VARCHAR(191),
    ADD COLUMN     `last_name` VARCHAR(191),
    MODIFY `id` VARCHAR(36) NOT NULL,
    MODIFY `email` VARCHAR(191);

-- CreateIndex
CREATE UNIQUE INDEX `user.id_unique` ON `user`(`id`);
