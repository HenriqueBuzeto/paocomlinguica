import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProdutosPage() {
  return (
    <AppShell title="Produtos">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Catálogo</CardTitle>
            <CardDescription>
              Gerencie produtos e categorias (em construção)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border bg-background/60 px-4 py-10 text-center">
              <div className="text-sm font-medium">Em breve</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Próximo módulo: CRUD completo de produtos.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
