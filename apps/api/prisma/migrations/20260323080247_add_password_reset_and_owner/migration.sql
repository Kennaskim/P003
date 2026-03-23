/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Owner` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[passwordResetToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Owner" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordResetExpiresAt" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Owner_userId_key" ON "Owner"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_passwordResetToken_key" ON "User"("passwordResetToken");

-- AddForeignKey
ALTER TABLE "Owner" ADD CONSTRAINT "Owner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
