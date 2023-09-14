/*
  Warnings:

  - The migration will add a unique constraint covering the columns `[firebase_id]` on the table `user`. If there are existing duplicate values, the migration will fail.
  - Added the required column `firebase_id` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN     `firebase_id` VARCHAR(28) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `user.firebase_id_unique` ON `user`(`firebase_id`);
