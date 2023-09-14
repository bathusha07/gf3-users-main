/*
  Warnings:

  - You are about to drop the column `preference_code` on the `preference` table. All the data in the column will be lost.
  - Added the required column `tag` to the `preference` table without a default value. This is not possible if the table is not empty.

*/

-- AlterTable
ALTER TABLE `preference` DROP COLUMN `preference_code`,
    ADD COLUMN     `tag` VARCHAR(36) NOT NULL;
