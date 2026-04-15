import "server-only";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  var prisma: PrismaClient | undefined;
  var neonPool: Pool | undefined;
}

export function getDb() {
  const url =
    process.env.DATABASE_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    process.env.POSTGRES_URL ??
    process.env.DATABASE_URL_UNPOOLED;

  if (typeof url !== "string" || url.length === 0) {
    throw new Error(
      `Database connection string is missing or invalid. typeof DATABASE_URL is ${typeof process.env
        .DATABASE_URL}.`,
    );
  }

  const pool =
    global.neonPool ??
    new Pool({
      connectionString: url,
    });

  if (process.env.NODE_ENV !== "production") global.neonPool = pool;

  const adapter = new PrismaPg(pool);

  const prisma =
    global.prisma ??
    new PrismaClient({ adapter });
  if (process.env.NODE_ENV !== "production") global.prisma = prisma;
  return prisma;
}
