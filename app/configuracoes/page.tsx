import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ConfiguracoesPage() {
  return (
    <AppShell title="Configurações">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Administração</CardTitle>
            <CardDescription>
              Métodos de pagamento, usuários e preferências (em construção)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border bg-background/60 px-4 py-10 text-center">
              <div className="text-sm font-medium">Em breve</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Vamos implementar após relatórios.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
