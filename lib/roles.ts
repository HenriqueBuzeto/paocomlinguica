export const roles = ["ADMIN", "GERENTE", "OPERADOR", "GARCON", "COZINHA", "ENTREGADOR", "ESTOQUE"] as const;

export type RoleName = (typeof roles)[number];

export const rolePriority: Record<RoleName, number> = {
  GARCON: 1,
  COZINHA: 1,
  ENTREGADOR: 1,
  ESTOQUE: 1,
  OPERADOR: 1,
  GERENTE: 2,
  ADMIN: 3,
};

export function hasRole(userRole: string | undefined, requiredRole: RoleName) {
  if (!userRole) return false;
  if (!roles.includes(userRole as RoleName)) return false;
  return rolePriority[userRole as RoleName] >= rolePriority[requiredRole];
}
