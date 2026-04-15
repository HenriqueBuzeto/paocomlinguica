import { notFound } from "next/navigation";

import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";
import { ProductForm } from "@/features/products/components/product-form";
import { getProductById, listCategories } from "@/server/products/product-service";

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductById({ id }),
    listCategories(),
  ]);

  if (!product) return notFound();

  return (
    <AppShell title="Editar produto">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Atualize dados e disponibilidade do produto.
          </p>
          <ButtonLink variant="outline" href="/produtos">Voltar</ButtonLink>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{product.name}</CardTitle>
            <CardDescription>
              Ajuste preço, custo, categoria e status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProductForm
              mode="edit"
              categories={categories.map((c) => ({ id: c.id, name: c.name, active: c.active }))}
              initial={{
                id: product.id,
                name: product.name,
                price: product.price.toString(),
                cost: product.cost?.toString() ?? "",
                categoryId: product.categoryId,
                active: product.active,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
