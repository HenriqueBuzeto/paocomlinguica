import { AppShell } from "@/components/shell/app-shell";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CategoryCreateForm } from "@/features/products/components/category-create-form";
import { toggleCategoryActiveAction, toggleProductActiveAction } from "@/app/produtos/actions";
import { listCategories, listProducts } from "@/server/products/product-service";

function formatMoney(value: unknown) {
  if (typeof value === "number") {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) {
      return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }
  }
  if (value && typeof value === "object" && "toString" in value) {
    const n = Number((value as { toString: () => string }).toString());
    if (Number.isFinite(n)) {
      return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }
  }
  return "--";
}

export default async function ProdutosPage() {
  const [categories, products] = await Promise.all([listCategories(), listProducts()]);

  return (
    <AppShell title="Produtos">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Cadastre produtos e organize por categorias.
            </p>
          </div>
          <ButtonLink href="/produtos/novo">Novo produto</ButtonLink>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Produtos</CardTitle>
              <CardDescription>
                Ative/desative e edite o catálogo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <div className="rounded-2xl border bg-background/60 px-4 py-10 text-center">
                  <div className="text-sm font-medium">Nenhum produto</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Crie seu primeiro produto.
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border bg-background/60">
                  <div className="grid grid-cols-12 gap-3 border-b bg-muted/40 px-4 py-3 text-xs font-medium text-muted-foreground">
                    <div className="col-span-4">Produto</div>
                    <div className="col-span-3">Categoria</div>
                    <div className="col-span-2 text-right">Preço</div>
                    <div className="col-span-1 text-center">Status</div>
                    <div className="col-span-2 text-right">Ações</div>
                  </div>

                  <div className="divide-y">
                    {products.map((p: (typeof products)[number]) => (
                      <div
                        key={p.id}
                        className="grid grid-cols-12 items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/30"
                      >
                        <div className="col-span-4 min-w-0">
                          <div className="truncate font-medium">{p.name}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {p.cost ? `Custo: ${formatMoney(p.cost)}` : "Custo: —"}
                          </div>
                        </div>
                        <div className="col-span-3 truncate text-muted-foreground">
                          {p.category?.name ?? "—"}
                        </div>
                        <div className="col-span-2 text-right font-semibold">
                          {formatMoney(p.price)}
                        </div>
                        <div className="col-span-1 text-center">
                          <span
                            className={
                              p.active
                                ? "inline-flex items-center rounded-full border bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                                : "inline-flex items-center rounded-full border bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-600"
                            }
                          >
                            {p.active ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                        <div className="col-span-2 flex items-center justify-end gap-2">
                          <ButtonLink variant="outline" size="sm" href={`/produtos/${p.id}/editar`}>
                            Editar
                          </ButtonLink>
                          <form action={toggleProductActiveAction}>
                            <input type="hidden" name="id" value={p.id} />
                            <Button variant="outline" size="sm" type="submit">
                              {p.active ? "Desativar" : "Ativar"}
                            </Button>
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Categorias</CardTitle>
              <CardDescription>
                Crie e controle categorias.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <CategoryCreateForm />

                <div className="overflow-hidden rounded-2xl border bg-background/60">
                  <div className="grid grid-cols-12 gap-3 border-b bg-muted/40 px-4 py-3 text-xs font-medium text-muted-foreground">
                    <div className="col-span-8">Nome</div>
                    <div className="col-span-4 text-right">Ação</div>
                  </div>
                  <div className="divide-y">
                    {categories.map((c: (typeof categories)[number]) => (
                      <div
                        key={c.id}
                        className="grid grid-cols-12 items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/30"
                      >
                        <div className="col-span-8 min-w-0">
                          <div className="truncate font-medium">{c.name}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {c.active ? "Ativa" : "Inativa"}
                          </div>
                        </div>
                        <div className="col-span-4 flex justify-end">
                          <form action={toggleCategoryActiveAction}>
                            <input type="hidden" name="id" value={c.id} />
                            <Button variant="outline" size="sm" type="submit">
                              {c.active ? "Desativar" : "Ativar"}
                            </Button>
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
