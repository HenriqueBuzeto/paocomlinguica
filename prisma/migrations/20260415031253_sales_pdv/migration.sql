-- CreateEnum
CREATE TYPE "PaymentMethodKind" AS ENUM ('CASH', 'PIX', 'CARD', 'OTHER');

-- AlterTable
ALTER TABLE "PaymentMethod" ADD COLUMN     "kind" "PaymentMethodKind" NOT NULL DEFAULT 'CASH';

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "deliveryFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "notes" TEXT;
