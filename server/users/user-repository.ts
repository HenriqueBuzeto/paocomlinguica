import "server-only";

import { getDb } from "@/lib/db";

export async function findUserByEmail(email: string) {
  return getDb().user.findUnique({
    where: { email },
    include: { role: true },
  });
}
