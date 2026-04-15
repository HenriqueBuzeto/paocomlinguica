"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { cancelSale } from "@/server/sales/sale-service";

export async function cancelSaleAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "");
  await cancelSale({ id, reason });
  revalidatePath("/vendas");
  redirect("/vendas?canceled=1");
}
