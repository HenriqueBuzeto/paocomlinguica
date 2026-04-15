"use server";

import { cancelSaleAction as cancelSaleActionImpl } from "@/app/vendas/cancel-actions";

export async function cancelSaleAction(formData: FormData) {
  return cancelSaleActionImpl(formData);
}
