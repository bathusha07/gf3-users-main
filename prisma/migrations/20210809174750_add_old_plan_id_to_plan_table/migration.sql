/*
  Warnings:

  - Added the required column `old_plan_id` to the `plan` table without a default value. This is not possible if the table is not empty.

*/

-- AlterTable
ALTER TABLE `plan` ADD COLUMN     `old_plan_id` INTEGER NOT NULL;
