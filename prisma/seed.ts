import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaClient, RoleName, PaymentMethodKind } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

config({ path: ".env" });

// Proteção contra seed destrutivo em produção
if (
  process.env.NODE_ENV === "production" &&
  process.env.ALLOW_DESTRUCTIVE_SEED !== "true"
) {
  throw new Error("Seed destrutivo bloqueado em produção.");
}

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
  const roles: RoleName[] = ["ADMIN", "GERENTE", "OPERADOR", "GARCON", "COZINHA", "ENTREGADOR", "ESTOQUE"];
  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const adminRole = await prisma.role.findUnique({ where: { name: "ADMIN" } });
  if (!adminRole) {
    throw new Error("ADMIN role not found after seeding");
  }

  // 2. Seeding Granular Permissions
  const permissions = [
    { code: "tables.open", description: "Abrir sessão de mesa" },
    { code: "tabs.create", description: "Criar comanda na mesa" },
    { code: "tabs.transfer_item", description: "Transferir item entre comandas" },
    { code: "tabs.cancel_item", description: "Cancelar item enviado à cozinha" },
    { code: "discounts.apply", description: "Aplicar desconto padrão (< 5%)" },
    { code: "discounts.apply_above_limit", description: "Aplicar desconto superior" },
    { code: "fees.remove", description: "Remover taxa de serviço sugerida" },
    { code: "cash.open", description: "Abrir caixa" },
    { code: "cash.withdraw", description: "Efetuar sangria no caixa" },
    { code: "cash.close", description: "Fechar caixa" },
    { code: "cash.reopen", description: "Reabrir caixa fechado" },
    { code: "inventory.adjust", description: "Lançar ajustes manuais de estoque" },
    { code: "inventory.allow_negative", description: "Autorizar venda de item sem estoque" },
    { code: "reports.view_financial", description: "Visualizar relatórios e dashboards" },
    { code: "settings.manage", description: "Alterar configurações do sistema" },
    { code: "audit.view", description: "Acessar logs de auditoria" }
  ];

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: { description: p.description },
      create: { code: p.code, description: p.description }
    });
  }

  // 3. Map permissions to ADMIN role
  const allDbPermissions = await prisma.permission.findMany();
  for (const dbPerm of allDbPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: dbPerm.id
        }
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: dbPerm.id
      }
    });
  }

  // 4. Limpar dados anteriores de demonstração de forma controlada (apenas para desenvolvimento local)
  if (process.env.NODE_ENV !== "production") {
    try {
      await prisma.product.deleteMany();
      await prisma.category.deleteMany();
    } catch (err) {
      console.log("Aviso: Falha ao limpar tabelas locais. Proseguindo...");
    }
  }

  // 5. Meios de Pagamento
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

  // 6. Usuários
  const email = "hbdevstudio@gmail.com";
  const passwordHash = await bcrypt.hash("Hique03@", 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
    },
    create: {
      email,
      name: "Henrique Buzeto",
      passwordHash,
    },
  });

  // Link User to Admin Role
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: adminRole.id
      }
    },
    update: {},
    create: {
      userId: user.id,
      roleId: adminRole.id
    }
  });

  // 7. Categorias
  const catLanches = await prisma.category.upsert({
    where: { name: "Lanches" },
    update: {},
    create: { name: "Lanches" }
  });
  const catPorcoes = await prisma.category.upsert({
    where: { name: "Acompanhamentos" },
    update: {},
    create: { name: "Acompanhamentos" }
  });
  const catBebidas = await prisma.category.upsert({
    where: { name: "Bebidas" },
    update: {},
    create: { name: "Bebidas" }
  });
  const catSobremesas = await prisma.category.upsert({
    where: { name: "Sobremesas" },
    update: {},
    create: { name: "Sobremesas" }
  });

  // 8. Produtos
  const productsToSeed = [
    { name: "Pão com Linguiça Tradicional", price: 18.00, cost: 7.50, categoryId: catLanches.id },
    { name: "Pão com Linguiça & Queijo Coalho", price: 22.00, cost: 9.00, categoryId: catLanches.id },
    { name: "Hambúrguer de Linguiça Artesanal", price: 26.00, cost: 11.50, categoryId: catLanches.id },
    { name: "Batata Frita Rústica da Casa", price: 14.00, cost: 4.50, categoryId: catPorcoes.id },
    { name: "Coca-Cola Original Lata", price: 6.00, cost: 2.20, categoryId: catBebidas.id },
    { name: "Milkshake de Ovomaltine 400ml", price: 16.00, cost: 6.00, categoryId: catSobremesas.id },
  ];

  for (const prod of productsToSeed) {
    const existing = await prisma.product.findFirst({
      where: { name: prod.name }
    });
    if (!existing) {
      await prisma.product.create({
        data: prod
      });
    }
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
