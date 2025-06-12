/*
  Warnings:

  - Added the required column `passage` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bibleBook` to the `Study` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bibleChapter` to the `Study` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "passage" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Study" ADD COLUMN     "bibleBook" TEXT NOT NULL,
ADD COLUMN     "bibleChapter" INTEGER NOT NULL;
