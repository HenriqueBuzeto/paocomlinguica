import "server-only";

import { db } from "@/lib/db";

export async function findUserByEmail(email: string) {
  return db.user.findUnique({
    where: { email },
    include: { role: true },
  });
}
