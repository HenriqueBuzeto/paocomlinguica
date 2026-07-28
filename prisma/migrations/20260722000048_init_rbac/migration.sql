/*
  Warnings:

  - You are about to drop the column `closingBalanceReported` on the `CashRegister` table. All the data in the column will be lost.
  - You are about to drop the column `difference` on the `CashRegister` table. All the data in the column will be lost.
  - You are about to drop the column `expectedBalance` on the `CashRegister` table. All the data in the column will be lost.
  - You are about to drop the `SalePayment` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TableSessionStatus" AS ENUM ('OPEN', 'AWAITING_SERVICE', 'IN_SERVICE', 'AWAITING_KITCHEN', 'AWAITING_PAYMENT', 'PARTIALLY_PAID', 'CLOSING', 'CLOSED', 'CANCELED');

-- CreateEnum
CREATE TYPE "TabStatus" AS ENUM ('OPEN', 'IN_SERVICE', 'AWAITING_PAYMENT', 'PARTIALLY_PAID', 'PAID', 'CANCELED', 'TRANSFERRED', 'CLOSED_WITH_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "KitchenTicketStatus" AS ENUM ('PENDING', 'IN_PREPARATION', 'READY', 'DELIVERED', 'CANCELED');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('CONFIRMED_PRODUCTION', 'LOSS', 'INPUT_ADJUSTMENT', 'OUTPUT_ADJUSTMENT', 'CANCEL_REVERSAL');

-- DropForeignKey
ALTER TABLE "SalePayment" DROP CONSTRAINT "SalePayment_paymentMethodId_fkey";

-- DropForeignKey
ALTER TABLE "SalePayment" DROP CONSTRAINT "SalePayment_saleId_fkey";

-- DropIndex
DROP INDEX "CashMovement_cashRegisterId_createdAt_idx";

-- DropIndex
DROP INDEX "CashMovement_saleId_idx";

-- DropIndex
DROP INDEX "CashMovement_type_status_idx";

-- DropIndex
DROP INDEX "CashMovement_userId_createdAt_idx";

-- DropIndex
DROP INDEX "CashRegister_openedAt_idx";

-- DropIndex
DROP INDEX "CashRegister_openedById_status_idx";

-- DropIndex
DROP INDEX "CashRegister_status_idx";

-- AlterTable
ALTER TABLE "CashRegister" DROP COLUMN "closingBalanceReported",
DROP COLUMN "difference",
DROP COLUMN "expectedBalance",
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "SalePayment";

-- CreateTable
CREATE TABLE "CashClosing" (
    "id" TEXT NOT NULL,
    "cashRegisterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashClosing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashClosingMethod" (
    "id" TEXT NOT NULL,
    "closingId" TEXT NOT NULL,
    "methodName" TEXT NOT NULL,
    "expectedValue" DECIMAL(12,2) NOT NULL,
    "declaredValue" DECIMAL(12,2) NOT NULL,
    "difference" DECIMAL(12,2) NOT NULL,
    "justification" TEXT,

    CONSTRAINT "CashClosingMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiningTable" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "capacity" INTEGER,
    "section" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DiningTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TableSession" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "status" "TableSessionStatus" NOT NULL DEFAULT 'OPEN',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "openedById" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TableSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tab" (
    "id" TEXT NOT NULL,
    "tableSessionId" TEXT,
    "tabNumber" TEXT NOT NULL,
    "customerName" TEXT,
    "status" "TabStatus" NOT NULL DEFAULT 'OPEN',
    "version" INTEGER NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "addonsTotal" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "taxTotal" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "discountTotal" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "pendingAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "roundingRule" TEXT NOT NULL DEFAULT 'HALF_UP',
    "feePolicyVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TabItem" (
    "id" TEXT NOT NULL,
    "tabId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "productNameSnapshot" TEXT NOT NULL,
    "unitPriceSnapshot" DECIMAL(12,2) NOT NULL,
    "variantDescription" TEXT,
    "addonsPriceSnapshot" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "feesSnapshot" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "total" DECIMAL(12,2) NOT NULL,
    "status" "KitchenTicketStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,

    CONSTRAINT "TabItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TabItemAddon" (
    "id" TEXT NOT NULL,
    "tabItemId" TEXT NOT NULL,
    "addonId" TEXT NOT NULL,
    "addonNameSnapshot" TEXT NOT NULL,
    "unitPriceSnapshot" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "inventoryConsumptionStatus" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "TabItemAddon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeePolicy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FeePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeePolicyVersion" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),

    CONSTRAINT "FeePolicyVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppliedFee" (
    "id" TEXT NOT NULL,
    "tabId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "baseAmount" DECIMAL(12,2) NOT NULL,
    "rate" DECIMAL(12,2) NOT NULL,
    "calculatedValue" DECIMAL(12,2) NOT NULL,
    "appliedById" TEXT NOT NULL,
    "removedById" TEXT,
    "justification" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppliedFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryBalance" (
    "id" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "currentQty" DECIMAL(12,3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "InventoryBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "previousQty" DECIMAL(12,3) NOT NULL,
    "qtyMoved" DECIMAL(12,3) NOT NULL,
    "nextQty" DECIMAL(12,3) NOT NULL,
    "type" "InventoryMovementType" NOT NULL,
    "reason" TEXT,
    "source" TEXT,
    "tabItemId" TEXT,
    "saleId" TEXT,
    "operatorId" TEXT NOT NULL,
    "authorizerId" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeIngredient" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,

    CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "tabId" TEXT NOT NULL,
    "cashRegisterId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyKey" (
    "id" TEXT NOT NULL,
    "operationType" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "responseStatus" INTEGER,
    "responseBody" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "terminalId" TEXT,
    "sessionId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "actionCategory" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "justification" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiningTable_number_key" ON "DiningTable"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_name_key" ON "Ingredient"("name");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryBalance_ingredientId_key" ON "InventoryBalance"("ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryMovement_idempotencyKey_key" ON "InventoryMovement"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_productId_key" ON "Recipe"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyKey_operationType_idempotencyKey_key" ON "IdempotencyKey"("operationType", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "CashClosing" ADD CONSTRAINT "CashClosing_cashRegisterId_fkey" FOREIGN KEY ("cashRegisterId") REFERENCES "CashRegister"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashClosingMethod" ADD CONSTRAINT "CashClosingMethod_closingId_fkey" FOREIGN KEY ("closingId") REFERENCES "CashClosing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableSession" ADD CONSTRAINT "TableSession_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "DiningTable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tab" ADD CONSTRAINT "Tab_tableSessionId_fkey" FOREIGN KEY ("tableSessionId") REFERENCES "TableSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TabItem" ADD CONSTRAINT "TabItem_tabId_fkey" FOREIGN KEY ("tabId") REFERENCES "Tab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TabItemAddon" ADD CONSTRAINT "TabItemAddon_tabItemId_fkey" FOREIGN KEY ("tabItemId") REFERENCES "TabItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePolicyVersion" ADD CONSTRAINT "FeePolicyVersion_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "FeePolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppliedFee" ADD CONSTRAINT "AppliedFee_tabId_fkey" FOREIGN KEY ("tabId") REFERENCES "Tab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryBalance" ADD CONSTRAINT "InventoryBalance_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tabId_fkey" FOREIGN KEY ("tabId") REFERENCES "Tab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_cashRegisterId_fkey" FOREIGN KEY ("cashRegisterId") REFERENCES "CashRegister"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
