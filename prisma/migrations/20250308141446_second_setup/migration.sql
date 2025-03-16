/*
  Warnings:

  - You are about to drop the column `bunnyStreamVideoId` on the `RecordRequest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `RecordRequest` DROP COLUMN `bunnyStreamVideoId`,
    ADD COLUMN `bsOriginalVideoId` VARCHAR(191) NULL,
    ADD COLUMN `bsReactionVideoId` VARCHAR(191) NULL;
