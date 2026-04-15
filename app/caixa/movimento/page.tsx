import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";
import { AddCashMovementForm } from "@/features/cash/components/add-cash-movement-form";

export default async function MovimentoCaixaPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;

  return (
    <AppShell title="Movimentação">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Registre uma entrada ou saída no caixa.
            </p>
          </div>
          <ButtonLink variant="outline" href="/caixa">Voltar</ButtonLink>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nova movimentação</CardTitle>
            <CardDescription>
              Tudo vira movimentação: sangria, suprimento e despesas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddCashMovementForm defaultType={tipo} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
