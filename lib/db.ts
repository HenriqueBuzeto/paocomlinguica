import "server-only";

import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const prisma = global.prisma ?? new PrismaClient();
  if (process.env.NODE_ENV !== "production") global.prisma = prisma;
  return prisma;
}
