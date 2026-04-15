import "server-only";

import bcrypt from "bcryptjs";

import { findUserByEmail } from "@/server/users/user-repository";
import { credentialsSchema, type CredentialsInput } from "@/features/auth/schemas";

export async function verifyCredentials(input: CredentialsInput) {
  const { email, password } = credentialsSchema.parse(input);

  const user = await findUserByEmail(email);
  if (!user) return null;

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;

  return {
    id: user.id,
    name: user.name ?? user.email,
    email: user.email,
    role: user.role.name,
  };
}
