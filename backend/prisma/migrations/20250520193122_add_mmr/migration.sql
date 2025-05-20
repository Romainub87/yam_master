/*
  Warnings:

  - Made the column `mmr` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "users" ALTER COLUMN "mmr" SET NOT NULL,
ALTER COLUMN "mmr" SET DEFAULT 400;
