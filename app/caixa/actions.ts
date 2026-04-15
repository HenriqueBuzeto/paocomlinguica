"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { addCashMovement, closeCashRegister, openCashRegister } from "@/server/cash/cash-service";

type AllowedMovementType =
  | "SANGRIA"
  | "SUPRIMENTO"
  | "DESPESA"
  | "ENTRADA_MANUAL"
  | "SAIDA_MANUAL";

export async function openCashRegisterAction(formData: FormData) {
  const openingBalance = String(formData.get("openingBalance") ?? "").replace(",", ".");
  await openCashRegister({ openingBalance });
  revalidatePath("/caixa");
  redirect("/caixa");
}

export async function closeCashRegisterAction(formData: FormData) {
  const closingBalanceReported = String(formData.get("closingBalanceReported") ?? "").replace(",", ".");
  await closeCashRegister({ closingBalanceReported });
  revalidatePath("/caixa");
  redirect("/caixa");
}

export async function addCashMovementAction(formData: FormData) {
  const type = String(formData.get("type") ?? "");
  const amount = String(formData.get("amount") ?? "").replace(",", ".");
  const description = String(formData.get("description") ?? "");

  const upper = type.toUpperCase() as AllowedMovementType;

  await addCashMovement({
    type: upper,
    amount,
    description,
  });

  revalidatePath("/caixa");
  redirect("/caixa");
}
