import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Wallet, Coins } from "lucide-react";
import { BrasiliaClock } from "@/components/dashboard/brasilia-clock";

export default function Home() {
  return (
    <AppShell title="Dashboard">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Visão geral operacional (em construção)
            </p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="rounded-2xl border bg-card px-4 py-2 shadow-sm">
              <BrasiliaClock />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="gap-3">
              <div className="flex items-center justify-between">
                <CardDescription>Caixa</CardDescription>
                <span className="grid size-10 place-items-center rounded-2xl border bg-muted/40">
                  <Wallet className="size-4 text-muted-foreground" />
                </span>
              </div>
              <CardTitle className="text-4xl font-semibold tracking-tight">
                --
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Status e movimentações do caixa
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-3">
              <div className="flex items-center justify-between">
                <CardDescription>Total vendido hoje</CardDescription>
                <span className="grid size-10 place-items-center rounded-2xl border bg-muted/40">
                  <TrendingUp className="size-4 text-muted-foreground" />
                </span>
              </div>
              <CardTitle className="text-4xl font-semibold tracking-tight">
                --
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Comparativo e performance diária
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-3">
              <div className="flex items-center justify-between">
                <CardDescription>Saldo atual</CardDescription>
                <span className="grid size-10 place-items-center rounded-2xl border bg-muted/40">
                  <Coins className="size-4 text-muted-foreground" />
                </span>
              </div>
              <CardTitle className="text-4xl font-semibold tracking-tight">
                --
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Consolidado de entradas e saídas
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Atividade</CardTitle>
              <CardDescription>
                Painel de gráficos e insights (em breve)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[320px] rounded-2xl border bg-gradient-to-b from-muted/30 to-background" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumo</CardTitle>
              <CardDescription>Últimas movimentações (em breve)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-2xl border bg-background/60 px-4 py-3 shadow-sm"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        Movimento
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        Detalhe
                      </div>
                    </div>
                    <div className="text-sm font-semibold">--</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
