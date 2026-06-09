import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaClient, RoleName, PaymentMethodKind } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

config({ path: ".env" });

const url =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL ??
  process.env.DATABASE_URL_UNPOOLED;

if (typeof url !== "string" || url.length === 0) {
  throw new Error("Database connection string is missing or invalid");
}

console.log("seeding-db-premium");

const pool = new Pool({
  connectionString: url,
});

const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  // 1. Roles
  const roles: RoleName[] = ["ADMIN", "GERENTE", "OPERADOR"];
  await prisma.role.createMany({
    data: roles.map((name) => ({ name })),
    skipDuplicates: true,
  });

  const adminRole = await prisma.role.findUnique({ where: { name: "ADMIN" } });
  if (!adminRole) {
    throw new Error("ADMIN role not found after seeding");
  }

  // 2. Limpar dados anteriores (apenas para o seed limpo e correto)
  await prisma.saleItem.deleteMany();
  await prisma.salePayment.deleteMany();
  await prisma.cashMovement.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.cashRegister.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  // 3. Meios de Pagamento
  const pms = [
    { name: "DINHEIRO", kind: "CASH" as const },
    { name: "PIX", kind: "PIX" as const },
    { name: "CARTAO_DEBITO", kind: "CARD" as const },
    { name: "CARTAO_CREDITO", kind: "CARD" as const },
  ];
  for (const pm of pms) {
    await prisma.paymentMethod.upsert({
      where: { name: pm.name },
      update: { kind: pm.kind, active: true },
      create: { name: pm.name, kind: pm.kind, active: true },
    });
  }

  const pmDinheiro = await prisma.paymentMethod.findUnique({ where: { name: "DINHEIRO" } });
  const pmPix = await prisma.paymentMethod.findUnique({ where: { name: "PIX" } });

  // 4. Usuários
  const email = "hbdevstudio@gmail.com";
  const passwordHash = await bcrypt.hash("Hique03@", 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      roleId: adminRole.id,
    },
    create: {
      email,
      name: "Henrique Buzeto",
      passwordHash,
      roleId: adminRole.id,
    },
  });

  // 5. Categorias
  const catLanches = await prisma.category.create({ data: { name: "Lanches" } });
  const catPorcoes = await prisma.category.create({ data: { name: "Acompanhamentos" } });
  const catBebidas = await prisma.category.create({ data: { name: "Bebidas" } });
  const catSobremesas = await prisma.category.create({ data: { name: "Sobremesas" } });

  // 6. Produtos
  const p1 = await prisma.product.create({
    data: { name: "Pão com Linguiça Tradicional", price: 18.00, cost: 7.50, categoryId: catLanches.id },
  });
  const p2 = await prisma.product.create({
    data: { name: "Pão com Linguiça & Queijo Coalho", price: 22.00, cost: 9.00, categoryId: catLanches.id },
  });
  const p3 = await prisma.product.create({
    data: { name: "Hambúrguer de Linguiça Artesanal", price: 26.00, cost: 11.50, categoryId: catLanches.id },
  });
  const p4 = await prisma.product.create({
    data: { name: "Batata Frita Rústica da Casa", price: 14.00, cost: 4.50, categoryId: catPorcoes.id },
  });
  const p5 = await prisma.product.create({
    data: { name: "Coca-Cola Original Lata", price: 6.00, cost: 2.20, categoryId: catBebidas.id },
  });
  const p6 = await prisma.product.create({
    data: { name: "Milkshake de Ovomaltine 400ml", price: 16.00, cost: 6.00, categoryId: catSobremesas.id },
  });

  // 7. Caixas e vendas de demonstração no passado
  const days = [3, 2, 1]; // 3 dias atrás, 2 dias atrás, 1 dia atrás
  for (const d of days) {
    const dateOpened = new Date();
    dateOpened.setDate(dateOpened.getDate() - d);
    dateOpened.setHours(12, 0, 0, 0);

    const dateClosed = new Date(dateOpened);
    dateClosed.setHours(22, 0, 0, 0);

    const openingBalance = 100.00;

    // Criar caixa fechado
    const cashRegister = await prisma.cashRegister.create({
      data: {
        status: "CLOSED",
        openedAt: dateOpened,
        closedAt: dateClosed,
        openingBalance,
        openedById: user.id,
        closedById: user.id,
      },
    });

    // Adicionar movimento de abertura
    await prisma.cashMovement.create({
      data: {
        cashRegisterId: cashRegister.id,
        type: "SUPRIMENTO",
        amount: openingBalance,
        description: "Abertura de caixa",
        userId: user.id,
        createdAt: dateOpened,
      },
    });

    // Venda em Dinheiro (gera CashMovement + Sale)
    const saleDate1 = new Date(dateOpened);
    saleDate1.setHours(14, 30, 0);

    const totalSale1 = 18.00; // Pão Tradicional
    const sale1 = await prisma.sale.create({
      data: {
        status: "COMPLETED",
        cashRegisterId: cashRegister.id,
        operatorId: user.id,
        customerName: "Carlos Silva",
        total: totalSale1,
        createdAt: saleDate1,
      },
    });

    await prisma.saleItem.create({
      data: {
        saleId: sale1.id,
        productId: p1.id,
        quantity: 1,
        unitPrice: p1.price,
        total: totalSale1,
        createdAt: saleDate1,
      },
    });

    await prisma.salePayment.create({
      data: {
        saleId: sale1.id,
        paymentMethodId: pmDinheiro!.id,
        amount: totalSale1,
        createdAt: saleDate1,
      },
    });

    await prisma.cashMovement.create({
      data: {
        cashRegisterId: cashRegister.id,
        type: "VENDA",
        amount: totalSale1,
        description: "Venda",
        saleId: sale1.id,
        userId: user.id,
        createdAt: saleDate1,
      },
    });

    // Venda em Pix (não gera CashMovement, apenas Sale)
    const saleDate2 = new Date(dateOpened);
    saleDate2.setHours(16, 45, 0);

    const totalSale2 = 28.00; // Pão Coalho + Coca-Cola
    const sale2 = await prisma.sale.create({
      data: {
        status: "COMPLETED",
        cashRegisterId: cashRegister.id,
        operatorId: user.id,
        customerName: "Mesa 3",
        total: totalSale2,
        createdAt: saleDate2,
      },
    });

    await prisma.saleItem.createMany({
      data: [
        { saleId: sale2.id, productId: p2.id, quantity: 1, unitPrice: p2.price, total: p2.price, createdAt: saleDate2 },
        { saleId: sale2.id, productId: p5.id, quantity: 1, unitPrice: p5.price, total: p5.price, createdAt: saleDate2 },
      ],
    });

    await prisma.salePayment.create({
      data: {
        saleId: sale2.id,
        paymentMethodId: pmPix!.id,
        amount: totalSale2,
        createdAt: saleDate2,
      },
    });

    // Adicionar um sangria de 50.00
    const sangriaDate = new Date(dateOpened);
    sangriaDate.setHours(19, 0, 0);
    await prisma.cashMovement.create({
      data: {
        cashRegisterId: cashRegister.id,
        type: "SANGRIA",
        amount: 50.00,
        description: "Sangria de dinheiro",
        userId: user.id,
        createdAt: sangriaDate,
      },
    });

    // expectedBalance = opening (100) + VENDA (18) - SANGRIA (50) = 68.00.
    const expected = 100 + 18 - 50;
    
    // Deixar uma quebra/sobra de caixa proposital para exibição na auditoria
    let reported = expected;
    if (d === 2) reported = expected - 5.00; // Quebra de R$5
    if (d === 1) reported = expected + 2.50; // Sobra de R$2.50

    const difference = reported - expected;

    await prisma.cashRegister.update({
      where: { id: cashRegister.id },
      data: {
        expectedBalance: expected,
        closingBalanceReported: reported,
        difference,
      },
    });
  }

  console.log("seed-complete", { userCount: 1 });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    await prisma.$disconnect();
    console.error(e);
    process.exit(1);
  });
