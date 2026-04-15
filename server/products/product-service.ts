import "server-only";

import { Prisma } from "@prisma/client";

import { getDb } from "@/lib/db";

function toDecimal(input: string) {
  const normalized = input.replace(",", ".").trim();
  return new Prisma.Decimal(normalized);
}

export async function listCategories() {
  const db = getDb();
  return db.category.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
}

export async function createCategory(input: { name: string }) {
  const db = getDb();
  const name = input.name.trim();
  if (!name) throw new Error("Nome da categoria é obrigatório.");
  return db.category.create({ data: { name } });
}

export async function toggleCategoryActive(input: { id: string }) {
  const db = getDb();
  const category = await db.category.findUnique({
    where: { id: input.id },
    select: { id: true, active: true },
  });
  if (!category) throw new Error("Categoria não encontrada.");
  return db.category.update({
    where: { id: category.id },
    data: { active: !category.active },
  });
}

export async function listProducts() {
  const db = getDb();
  return db.product.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    include: { category: true },
  });
}

export async function getProductById(input: { id: string }) {
  const db = getDb();
  return db.product.findUnique({
    where: { id: input.id },
    include: { category: true },
  });
}

export async function createProduct(input: {
  name: string;
  price: string;
  cost?: string;
  categoryId?: string;
  active: boolean;
}) {
  const db = getDb();
  const name = input.name.trim();
  if (!name) throw new Error("Nome do produto é obrigatório.");

  const price = toDecimal(input.price);
  if (!price.isFinite() || price.lte(0)) throw new Error("Preço inválido.");

  const cost = input.cost && input.cost.trim().length ? toDecimal(input.cost) : null;
  if (cost && (!cost.isFinite() || cost.lt(0))) throw new Error("Custo inválido.");

  const categoryId = input.categoryId && input.categoryId.length ? input.categoryId : null;

  return db.product.create({
    data: {
      name,
      price,
      cost,
      active: input.active,
      categoryId,
    },
  });
}

export async function updateProduct(input: {
  id: string;
  name: string;
  price: string;
  cost?: string;
  categoryId?: string;
  active: boolean;
}) {
  const db = getDb();
  const name = input.name.trim();
  if (!name) throw new Error("Nome do produto é obrigatório.");

  const price = toDecimal(input.price);
  if (!price.isFinite() || price.lte(0)) throw new Error("Preço inválido.");

  const cost = input.cost && input.cost.trim().length ? toDecimal(input.cost) : null;
  if (cost && (!cost.isFinite() || cost.lt(0))) throw new Error("Custo inválido.");

  const categoryId = input.categoryId && input.categoryId.length ? input.categoryId : null;

  return db.product.update({
    where: { id: input.id },
    data: {
      name,
      price,
      cost,
      active: input.active,
      categoryId,
    },
  });
}

export async function toggleProductActive(input: { id: string }) {
  const db = getDb();
  const product = await db.product.findUnique({
    where: { id: input.id },
    select: { id: true, active: true },
  });
  if (!product) throw new Error("Produto não encontrado.");
  return db.product.update({
    where: { id: product.id },
    data: { active: !product.active },
  });
}
