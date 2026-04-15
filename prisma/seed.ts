import { config } from "dotenv";

import bcrypt from "bcryptjs";

import { PrismaClient, RoleName } from "@prisma/client";
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

const parsed = new URL(url);
console.log("seeding-db", {
  host: parsed.host,
  database: parsed.pathname.replace("/", ""),
});

const pool = new Pool({
  connectionString: url,
});

const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const roles: RoleName[] = ["ADMIN", "GERENTE", "OPERADOR"];

  await prisma.role.createMany({
    data: roles.map((name) => ({ name })),
    skipDuplicates: true,
  });

  await prisma.paymentMethod.createMany({
    data: [
      { name: "DINHEIRO" },
      { name: "PIX" },
      { name: "CARTAO_DEBITO" },
      { name: "CARTAO_CREDITO" },
    ],
    skipDuplicates: true,
  });

  const adminRole = await prisma.role.findUnique({ where: { name: "ADMIN" } });
  if (!adminRole) {
    throw new Error("ADMIN role not found after seeding");
  }

  const email = "hbdevstudio@gmail.com";
  const passwordHash = await bcrypt.hash("Hique03@", 12);

  await prisma.user.upsert({
    where: { email },
    update: {
      roleId: adminRole.id,
    },
    create: {
      email,
      name: "Henrique Buzeto",
      passwordHash,
      roleId: adminRole.id,
    },
  });

  const userCount = await prisma.user.count();
  console.log("seed-complete", { userCount });
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
