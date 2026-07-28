import "server-only";

import bcrypt from "bcryptjs";

import { findUserByEmail } from "@/server/users/user-repository";
import { credentialsSchema, type CredentialsInput } from "@/features/auth/schemas";

import { getUserPermissions } from "@/lib/auth-utils";

export async function verifyCredentials(input: CredentialsInput) {
  const { email, password } = credentialsSchema.parse(input);

  const user = await findUserByEmail(email);
  if (!user) return null;

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;

  const roles = user.roles.map((r) => r.role.name);
  const permissions = await getUserPermissions(user.id);

  return {
    id: user.id,
    name: user.name ?? user.email,
    email: user.email,
    roles,
    permissions,
  };
}
