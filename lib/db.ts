import "server-only";

import { PrismaClient } from "@prisma/client";
import { Pool } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";

declare global {
  var prisma: PrismaClient | undefined;
  var neonPool: Pool | undefined;
}

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool =
    global.neonPool ??
    new Pool({
      connectionString: process.env.DATABASE_URL,
    });

  if (process.env.NODE_ENV !== "production") global.neonPool = pool;

  const adapter = new PrismaNeon(
    pool as unknown as ConstructorParameters<typeof PrismaNeon>[0],
  );

  const prisma =
    global.prisma ??
    new PrismaClient({ adapter });
  if (process.env.NODE_ENV !== "production") global.prisma = prisma;
  return prisma;
}
