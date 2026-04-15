import "server-only";

import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

function requireUserId(userId: unknown) {
  if (typeof userId !== "string" || userId.length === 0) {
    throw new Error("Unauthorized");
  }
  return userId;
}

function toDecimal(input: string | number | unknown) {
  if (typeof input === "string") {
    return new Prisma.Decimal(input.replace(",", ".").trim() || 0);
  }
  return new Prisma.Decimal(input as string | number);
}

type SaleItemInput = {
  productId: string;
  quantity: number;
};

type SalePaymentInput = {
  paymentMethodId: string;
  amount: string;
};

export async function createSale(input: {
  customerName?: string;
  notes?: string;
  discount?: string;
  deliveryFee?: string;
  items: SaleItemInput[];
  payments: SalePaymentInput[];
  cashReceived?: string;
}) {
  const session = await getServerSession(authOptions);
  const operatorId = requireUserId(session?.user?.id);

  const db = getDb();

  const cashRegister = await db.cashRegister.findFirst({
    where: { status: "OPEN" },
    select: { id: true },
  });

  if (!cashRegister) {
    throw new Error("Abra o caixa antes de realizar vendas");
  }

  const discount = toDecimal(input.discount ?? 0);
  if (!discount.isFinite() || discount.lt(0)) throw new Error("Desconto inválido.");

  const deliveryFee = toDecimal(input.deliveryFee ?? 0);
  if (!deliveryFee.isFinite() || deliveryFee.lt(0)) throw new Error("Taxa de entrega inválida.");

  const items = input.items
    .filter((i) => typeof i.productId === "string" && i.productId.length)
    .map((i) => ({ productId: i.productId, quantity: Math.trunc(i.quantity) }))
    .filter((i) => i.quantity > 0);

  if (items.length === 0) {
    throw new Error("Adicione pelo menos 1 item na venda.");
  }

  const productIds = Array.from(new Set(items.map((i) => i.productId)));
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, price: true, active: true },
  });

  if (products.length !== productIds.length) {
    throw new Error("Um ou mais produtos não foram encontrados.");
  }

  const inactive = products.find((p) => !p.active);
  if (inactive) {
    throw new Error(`Produto inativo: ${inactive.name}`);
  }

  const priceById: Map<string, Prisma.Decimal> = new Map(
    products.map((p) => [p.id, new Prisma.Decimal(p.price)]),
  );

  const computedItems = items.map((i) => {
    const unitPrice = priceById.get(i.productId);
    if (!unitPrice) throw new Error("Produto inválido.");
    const total = unitPrice.mul(i.quantity);
    return { ...i, unitPrice, total };
  });

  const subtotal = computedItems.reduce((acc, i) => acc.add(i.total), new Prisma.Decimal(0));
  if (discount.gt(subtotal)) throw new Error("Desconto não pode ser maior que o subtotal.");

  const total = subtotal.sub(discount).add(deliveryFee);
  if (total.lt(0)) throw new Error("Total inválido.");

  const payments = input.payments
    .filter((p) => typeof p.paymentMethodId === "string" && p.paymentMethodId.length)
    .map((p) => ({ paymentMethodId: p.paymentMethodId, amount: toDecimal(p.amount) }))
    .filter((p) => p.amount.isFinite() && p.amount.gt(0));

  if (payments.length === 0) {
    throw new Error("Informe pelo menos 1 pagamento.");
  }

  const paymentSum = payments.reduce((acc, p) => acc.add(p.amount), new Prisma.Decimal(0));
  if (!paymentSum.eq(total)) {
    throw new Error("A soma dos pagamentos deve ser igual ao total.");
  }

  const paymentMethods = await db.paymentMethod.findMany({
    where: { id: { in: payments.map((p) => p.paymentMethodId) } },
    select: { id: true, active: true, kind: true },
  });

  if (paymentMethods.length !== payments.length) {
    throw new Error("Método de pagamento inválido.");
  }

  const inactivePm = paymentMethods.find((m) => !m.active);
  if (inactivePm) {
    throw new Error("Método de pagamento inativo.");
  }

  const kindById: Map<string, (typeof paymentMethods)[number]["kind"]> = new Map(
    paymentMethods.map((m) => [m.id, m.kind] as const),
  );
  const cashAmount = payments
    .filter((p) => kindById.get(p.paymentMethodId) === "CASH")
    .reduce((acc, p) => acc.add(p.amount), new Prisma.Decimal(0));

  const cashReceived = input.cashReceived ? toDecimal(input.cashReceived) : null;
  if (cashAmount.gt(0)) {
    if (!cashReceived || !cashReceived.isFinite() || cashReceived.lt(total)) {
      throw new Error("Valor recebido em dinheiro inválido.");
    }
  }

  const changeDue = cashAmount.gt(0) && cashReceived ? cashReceived.sub(total) : null;

  return db.$transaction(async (tx: unknown) => {
    const prisma = tx as typeof db;

    const saleModel = prisma.sale as unknown as {
      create: (args: unknown) => Promise<{ id: string }>;
      update: (args: unknown) => Promise<unknown>;
      findUnique: (args: unknown) => Promise<unknown>;
    };

    const sale = await saleModel.create({
      data: {
        status: "COMPLETED",
        cashRegisterId: cashRegister.id,
        operatorId,
        customerName: input.customerName?.trim() || null,
        notes: input.notes?.trim() || null,
        discount,
        deliveryFee,
        cashReceived,
        changeDue,
        total,
      },
    });

    await prisma.saleItem.createMany({
      data: computedItems.map((i) => ({
        saleId: sale.id,
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        total: i.total,
      })),
    });

    await prisma.salePayment.createMany({
      data: payments.map((p) => ({
        saleId: sale.id,
        paymentMethodId: p.paymentMethodId,
        amount: p.amount,
      })),
    });

    if (cashAmount.gt(0)) {
      await prisma.cashMovement.create({
        data: {
          cashRegisterId: cashRegister.id,
          type: "VENDA",
          amount: cashAmount,
          description: "Venda",
          saleId: sale.id,
          userId: operatorId,
        },
      });
    }

    return sale;
  });
}

export async function cancelSale(input: { id: string; reason?: string }) {
  const session = await getServerSession(authOptions);
  const userId = requireUserId(session?.user?.id);

  const db = getDb();

  const openCash = await db.cashRegister.findFirst({
    where: { status: "OPEN" },
    select: { id: true },
  });

  if (!openCash) {
    throw new Error("Não é possível cancelar venda com o caixa fechado.");
  }

  return db.$transaction(async (tx: unknown) => {
    const prisma = tx as typeof db;

    const saleModel = prisma.sale as unknown as {
      update: (args: unknown) => Promise<unknown>;
    };

    const sale = await prisma.sale.findUnique({
      where: { id: input.id },
      include: {
        payments: {
          include: { paymentMethod: { select: { kind: true } } },
        },
      },
    });

    if (!sale) throw new Error("Venda não encontrada.");
    if (sale.status === "CANCELED") throw new Error("Venda já está cancelada.");
    if (sale.cashRegisterId !== openCash.id) {
      throw new Error("Não é possível cancelar venda de um caixa anterior.");
    }

    const total = new Prisma.Decimal(sale.total);
    const cashPaid = sale.payments
      .filter((p) => p.paymentMethod.kind === "CASH")
      .reduce((acc, p) => acc.add(new Prisma.Decimal(p.amount)), new Prisma.Decimal(0));

    await saleModel.update({
      where: { id: sale.id },
      data: {
        status: "CANCELED",
        canceledAt: new Date(),
        canceledById: userId,
        canceledReason: input.reason?.trim() || null,
      },
    });

    if (cashPaid.gt(0)) {
      await prisma.cashMovement.create({
        data: {
          cashRegisterId: openCash.id,
          type: "CANCELAMENTO",
          amount: cashPaid,
          description: "Cancelamento de venda",
          saleId: sale.id,
          userId,
        },
      });
    }

    return { id: sale.id, total: total.toString() };
  });
}
