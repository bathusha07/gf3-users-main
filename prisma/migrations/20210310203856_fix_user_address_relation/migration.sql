/*
  Warnings:

  - The migration will add a unique constraint covering the columns `[address_id]` on the table `user_address`. If there are existing duplicate values, the migration will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `user_address_address_id_unique` ON `user_address`(`address_id`);
