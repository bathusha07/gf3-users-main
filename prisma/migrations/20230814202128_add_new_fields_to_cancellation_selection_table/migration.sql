-- AlterTable
ALTER TABLE `cancellation_selection` ADD COLUMN `agent_id` VARCHAR(36) NULL,
    ADD COLUMN `category` VARCHAR(255) NULL,
    ADD COLUMN `source` ENUM('ADA', 'CLIENT', 'SYSTEM', 'ZENDESK') NULL;

-- CreateIndex
CREATE INDEX `agent_id` ON `cancellation_selection`(`agent_id`);

-- CreateIndex
CREATE INDEX `category` ON `cancellation_selection`(`category`);

-- CreateIndex
CREATE INDEX `source` ON `cancellation_selection`(`source`);
