import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";
import { ProductForm } from "@/features/products/components/product-form";
import { listCategories } from "@/server/products/product-service";

export default async function NovoProdutoPage() {
  const categories = await listCategories();

  return (
    <AppShell title="Novo produto">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Cadastre um produto para aparecer no PDV.
          </p>
          <ButtonLink variant="outline" href="/produtos">Voltar</ButtonLink>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados do produto</CardTitle>
            <CardDescription>
              Nome, preço, custo e categoria.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProductForm
              mode="create"
              categories={categories.map((c) => ({ id: c.id, name: c.name, active: c.active }))}
            />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
