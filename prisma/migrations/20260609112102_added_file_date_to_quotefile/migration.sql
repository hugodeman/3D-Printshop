/*
  Warnings:

  - Added the required column `filename` to the `QuoteFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mimeType` to the `QuoteFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size` to the `QuoteFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `QuoteFile` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "QuoteFile" DROP CONSTRAINT "QuoteFile_quoteId_fkey";

-- AlterTable
ALTER TABLE "QuoteFile" ADD COLUMN     "filename" TEXT NOT NULL,
ADD COLUMN     "mimeType" TEXT NOT NULL,
ADD COLUMN     "size" INTEGER NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "QuoteFile" ADD CONSTRAINT "QuoteFile_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
