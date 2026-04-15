"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSale } from "@/server/sales/sale-service";

export async function createSaleAction(payload: {
  customerName?: string;
  notes?: string;
  discount?: string;
  deliveryFee?: string;
  items: Array<{ productId: string; quantity: number }>;
  payments: Array<{ paymentMethodId: string; amount: string }>;
}) {
  await createSale(payload);
  revalidatePath("/vendas");
  redirect("/vendas?success=1");
}
