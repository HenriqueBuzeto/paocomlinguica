"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createCategory,
  createProduct,
  toggleCategoryActive,
  toggleProductActive,
  updateProduct,
} from "@/server/products/product-service";

export async function createCategoryAction(formData: FormData) {
  const name = String(formData.get("name") ?? "");
  await createCategory({ name });
  revalidatePath("/produtos");
  redirect("/produtos");
}

export async function toggleCategoryActiveAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await toggleCategoryActive({ id });
  revalidatePath("/produtos");
  redirect("/produtos");
}

export async function createProductAction(formData: FormData) {
  const name = String(formData.get("name") ?? "");
  const price = String(formData.get("price") ?? "");
  const cost = String(formData.get("cost") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "");
  const active = Boolean(formData.get("active"));

  await createProduct({
    name,
    price,
    cost,
    categoryId,
    active,
  });

  revalidatePath("/produtos");
  redirect("/produtos");
}

export async function updateProductAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "");
  const price = String(formData.get("price") ?? "");
  const cost = String(formData.get("cost") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "");
  const active = Boolean(formData.get("active"));

  await updateProduct({
    id,
    name,
    price,
    cost,
    categoryId,
    active,
  });

  revalidatePath("/produtos");
  redirect("/produtos");
}

export async function toggleProductActiveAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await toggleProductActive({ id });
  revalidatePath("/produtos");
  redirect("/produtos");
}
