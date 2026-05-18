/*
  Warnings:

  - You are about to drop the column `option` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "option";

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "option" TEXT;
