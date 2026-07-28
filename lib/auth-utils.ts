import "server-only";

import { getDb } from "@/lib/db";

/**
 * Verifica se um usuário possui uma permissão específica, considerando overrides e roles.
 * Lança um erro se o acesso for negado.
 */
export async function verifyUserPermission(userId: string, requiredPermission: string): Promise<boolean> {
  const db = getDb();

  // 1. Verificar override explícito do usuário
  const override = await db.userPermissionOverride.findFirst({
    where: {
      userId,
      permission: { code: requiredPermission }
    }
  });

  if (override) {
    if (!override.allowed) {
      throw new Error(`Acesso Negado: Permissão "${requiredPermission}" negada explicitamente.`);
    }
    return true;
  }

  // 2. Verificar permissões associadas às roles do usuário
  const hasPermission = await db.userRole.findFirst({
    where: {
      userId,
      role: {
        permissions: {
          some: {
            permission: { code: requiredPermission }
          }
        }
      }
    }
  });

  if (!hasPermission) {
    throw new Error(`Acesso Negado: Usuário não possui a permissão "${requiredPermission}".`);
  }

  return true;
}

/**
 * Retorna todas as permissões de um usuário (códigos de string).
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  const db = getDb();

  // Buscar permissões associadas às roles do usuário
  const roleRoles = await db.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true }
          }
        }
      }
    }
  });

  const permissionsSet = new Set<string>();

  for (const ur of roleRoles) {
    for (const rp of ur.role.permissions) {
      if (rp.permission.code) {
        permissionsSet.add(rp.permission.code);
      }
    }
  }

  // Buscar overrides
  const overrides = await db.userPermissionOverride.findMany({
    where: { userId },
    include: { permission: true }
  });

  for (const ov of overrides) {
    if (ov.allowed) {
      permissionsSet.add(ov.permission.code);
    } else {
      permissionsSet.delete(ov.permission.code);
    }
  }

  return Array.from(permissionsSet);
}
