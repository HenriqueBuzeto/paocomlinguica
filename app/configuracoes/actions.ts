"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { PaymentMethodKind, RoleName } from "@prisma/client";

export async function togglePaymentMethodActiveAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const db = getDb();

  const pm = await db.paymentMethod.findUnique({
    where: { id },
    select: { id: true, active: true },
  });

  if (!pm) {
    throw new Error("Método de pagamento não encontrado.");
  }

  await db.paymentMethod.update({
    where: { id: pm.id },
    data: { active: !pm.active },
  });

  revalidatePath("/configuracoes");
}

export async function createPaymentMethodAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim().toUpperCase().replace(/\s+/g, "_");
  const kind = String(formData.get("kind") ?? "OTHER") as PaymentMethodKind;

  if (!name) {
    throw new Error("Nome do método de pagamento é obrigatório.");
  }

  const db = getDb();

  await db.paymentMethod.create({
    data: {
      name,
      kind,
      active: true,
    },
  });

  revalidatePath("/configuracoes");
}

export async function createUserAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const roleName = String(formData.get("roleName") ?? "OPERADOR") as RoleName;

  if (!name || !email || !password) {
    throw new Error("Todos os campos são obrigatórios.");
  }

  const db = getDb();

  // Buscar ID da role correspondente
  const role = await db.role.findUnique({
    where: { name: roleName },
  });

  if (!role) {
    throw new Error(`Função ${roleName} não encontrada.`);
  }

  // Criptografar a senha
  const passwordHash = await bcrypt.hash(password, 12);

  // Criar o usuário
  await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      roleId: role.id,
    },
  });

  revalidatePath("/configuracoes");
}
