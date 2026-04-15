import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";
import { getCurrentCashRegister } from "@/server/cash/cash-service";

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

export default async function CaixaPage() {
  const cashRegister = await getCurrentCashRegister();

  return (
    <AppShell title="Caixa">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Controle de abertura, movimentações e fechamento
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!cashRegister ? (
              <ButtonLink href="/caixa/abrir">Abrir caixa</ButtonLink>
            ) : (
              <>
                <ButtonLink variant="outline" href="/caixa/movimento?tipo=SUPRIMENTO">
                  Suprimento
                </ButtonLink>
                <ButtonLink variant="outline" href="/caixa/movimento?tipo=SANGRIA">
                  Sangria
                </ButtonLink>
                <ButtonLink variant="outline" href="/caixa/movimento?tipo=DESPESA">
                  Despesa
                </ButtonLink>
                <ButtonLink href="/caixa/fechar">Fechar caixa</ButtonLink>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="gap-2">
              <CardDescription>Status</CardDescription>
              <CardTitle className="text-3xl font-semibold tracking-tight">
                {cashRegister ? "Aberto" : "Fechado"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                {cashRegister
                  ? `Aberto em ${new Date(cashRegister.openedAt).toLocaleString("pt-BR")}`
                  : "Abra o caixa para iniciar a operação"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-2">
              <CardDescription>Saldo inicial</CardDescription>
              <CardTitle className="text-3xl font-semibold tracking-tight">
                {cashRegister ? formatMoney(cashRegister.openingBalance) : "--"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Registrado como suprimento inicial
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-2">
              <CardDescription>Movimentações</CardDescription>
              <CardTitle className="text-3xl font-semibold tracking-tight">
                {cashRegister ? cashRegister.movements.length : "--"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Entradas e saídas registradas no caixa
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Movimentações</CardTitle>
            <CardDescription>
              Histórico do caixa atual (mais recente primeiro)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!cashRegister ? (
              <div className="rounded-2xl border bg-background/60 px-4 py-10 text-center">
                <div className="text-sm font-medium">Caixa fechado</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Abra o caixa para registrar movimentações.
                </div>
              </div>
            ) : cashRegister.movements.length === 0 ? (
              <div className="rounded-2xl border bg-background/60 px-4 py-10 text-center">
                <div className="text-sm font-medium">Nenhuma movimentação</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Adicione um suprimento, sangria ou despesa.
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border bg-background/60">
                <div className="grid grid-cols-12 gap-3 border-b bg-muted/40 px-4 py-3 text-xs font-medium text-muted-foreground">
                  <div className="col-span-3">Data</div>
                  <div className="col-span-2">Tipo</div>
                  <div className="col-span-5">Descrição</div>
                  <div className="col-span-2 text-right">Valor</div>
                </div>

                <div className="divide-y">
                  {cashRegister.movements.map((m: (typeof cashRegister.movements)[number]) => (
                    <div
                      key={m.id}
                      className="grid grid-cols-12 gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/30"
                    >
                      <div className="col-span-3 text-muted-foreground">
                        {new Date(m.createdAt).toLocaleString("pt-BR")}
                      </div>
                      <div className="col-span-2 font-medium">{m.type}</div>
                      <div className="col-span-5 truncate text-muted-foreground">
                        {m.description ?? "—"}
                      </div>
                      <div className="col-span-2 text-right font-semibold">
                        {formatMoney(m.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
