-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "canceledById" TEXT,
ADD COLUMN     "canceledReason" TEXT,
ADD COLUMN     "cashReceived" DECIMAL(12,2),
ADD COLUMN     "changeDue" DECIMAL(12,2);

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_canceledById_fkey" FOREIGN KEY ("canceledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
