import "server-only";

import { getServerSession } from "next-auth";
import { Prisma, type CashMovementType } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

function toDecimal(input: string | number | unknown) {
  return new Prisma.Decimal(input as string | number);
}

function requireUserId(userId: unknown) {
  if (typeof userId !== "string" || userId.length === 0) {
    throw new Error("Unauthorized");
  }
  return userId;
}

export async function getCurrentCashRegister() {
  const db = getDb();
  return db.cashRegister.findFirst({
    where: { status: "OPEN" },
    include: {
      openedBy: { select: { id: true, name: true, email: true } },
      movements: {
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
}

export async function openCashRegister(input: { openingBalance: string }) {
  const session = await getServerSession(authOptions);
  const userId = requireUserId(session?.user?.id);

  const openingBalance = toDecimal(input.openingBalance);
  if (!openingBalance.isFinite() || openingBalance.lte(0)) {
    throw new Error("Saldo inicial inválido.");
  }

  const db = getDb();

  return db.$transaction(async (tx: unknown) => {
    const prisma = tx as typeof db;
    const existingOpen = await prisma.cashRegister.findFirst({
      where: { status: "OPEN" },
      select: { id: true },
    });

    if (existingOpen) {
      throw new Error("Já existe um caixa aberto no momento.");
    }

    const cashRegister = await prisma.cashRegister.create({
      data: {
        status: "OPEN",
        openedById: userId,
        openingBalance,
      },
    });

    await prisma.cashMovement.create({
      data: {
        cashRegisterId: cashRegister.id,
        type: "SUPRIMENTO",
        amount: openingBalance,
        description: "Abertura de caixa",
        userId,
      },
    });

    return cashRegister;
  });
}

export async function addCashMovement(input: {
  type: Extract<CashMovementType, "SANGRIA" | "SUPRIMENTO" | "DESPESA" | "ENTRADA_MANUAL" | "SAIDA_MANUAL">;
  amount: string;
  description?: string;
}) {
  const session = await getServerSession(authOptions);
  const userId = requireUserId(session?.user?.id);

  const amount = toDecimal(input.amount);
  if (!amount.isFinite() || amount.lte(0)) {
    throw new Error("Valor inválido.");
  }

  const db = getDb();

  const cashRegister = await db.cashRegister.findFirst({
    where: { status: "OPEN" },
    select: { id: true },
  });

  if (!cashRegister) {
    throw new Error("Abra o caixa antes de realizar operações.");
  }

  return db.cashMovement.create({
    data: {
      cashRegisterId: cashRegister.id,
      type: input.type,
      amount,
      description: input.description?.trim() || null,
      userId,
    },
  });
}

function signedAmount(type: CashMovementType, amount: Prisma.Decimal) {
  switch (type) {
    case "SUPRIMENTO":
    case "ENTRADA_MANUAL":
    case "VENDA":
      return amount;
    case "SANGRIA":
    case "DESPESA":
    case "SAIDA_MANUAL":
    case "CANCELAMENTO":
      return amount.neg();
    default:
      return amount;
  }
}

export async function closeCashRegister(input: { closingBalanceReported: string }) {
  const session = await getServerSession(authOptions);
  const userId = requireUserId(session?.user?.id);

  const closingBalanceReported = toDecimal(input.closingBalanceReported);
  if (!closingBalanceReported.isFinite() || closingBalanceReported.lt(0)) {
    throw new Error("Valor informado inválido.");
  }

  const db = getDb();

  return db.$transaction(async (tx: unknown) => {
    const prisma = tx as typeof db;
    const cashRegister = await prisma.cashRegister.findFirst({
      where: { status: "OPEN" },
      include: {
        movements: { select: { type: true, amount: true, status: true } },
      },
    });

    if (!cashRegister) {
      throw new Error("Nenhum caixa aberto para fechar.");
    }

    const opening = toDecimal(cashRegister.openingBalance);

    const movementsSum = (cashRegister.movements as Array<{
      type: CashMovementType;
      amount: unknown;
      status: string;
    }>).filter((m) => m.status === "ACTIVE")
      .reduce((acc: Prisma.Decimal, m) => acc.add(signedAmount(m.type, toDecimal(m.amount))), toDecimal(0));

    const expectedBalance = opening.add(movementsSum);
    const difference = closingBalanceReported.sub(expectedBalance);

    return prisma.cashRegister.update({
      where: { id: cashRegister.id },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
        closedById: userId,
        closingBalanceReported,
        expectedBalance,
        difference,
      },
    });
  });
}
