-- CreateTable
CREATE TABLE "OrderExpense" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderExpense_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrderExpense" ADD CONSTRAINT "OrderExpense_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
