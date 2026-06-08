import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Wallet, Coins, ArrowUpRight, ArrowDownRight, FileSpreadsheet } from "lucide-react";
import { BrasiliaClock } from "@/components/dashboard/brasilia-clock";
import { getCurrentCashRegister } from "@/server/cash/cash-service";
import { getDb } from "@/lib/db";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { ButtonLink } from "@/components/ui/button-link";

function formatMoney(value: number | string | any) {
  if (value === undefined || value === null) return "--";
  const n = Number(value.toString());
  if (!Number.isFinite(n)) return "--";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function Home() {
  const db = getDb();
  
  // 1. Obter caixa aberto
  const openCash = await getCurrentCashRegister();
  
  // Se não houver caixa aberto, obter informações do último caixa fechado para exibir no histórico
  const lastClosedCash = !openCash
    ? await db.cashRegister.findFirst({
        orderBy: { openedAt: "desc" },
        include: {
          movements: {
            orderBy: { createdAt: "desc" },
            include: {
              user: { select: { name: true, email: true } },
            },
          },
        },
      })
    : null;

  const currentCash = openCash || lastClosedCash;

  // 2. Calcular saldo atual do caixa ativo (abertura + somatório das movimentações ativas)
  let currentBalance = 0;
  let cashStatus = "CLOSED";
  let movementsCount = 0;
  let recentMovements: any[] = [];

  if (currentCash) {
    cashStatus = currentCash.status;
    movementsCount = currentCash.movements.length;
    recentMovements = currentCash.movements.slice(0, 5); // Últimas 5 movimentações

    const opening = Number(currentCash.openingBalance.toString());
    const movementsSum = currentCash.movements
      .filter((m) => m.status === "ACTIVE")
      .reduce((acc, m) => {
        const amt = Number(m.amount.toString());
        switch (m.type) {
          case "SUPRIMENTO":
          case "ENTRADA_MANUAL":
          case "VENDA":
            return acc + amt;
          case "SANGRIA":
          case "DESPESA":
          case "SAIDA_MANUAL":
          case "CANCELAMENTO":
            return acc - amt;
          default:
            return acc;
        }
      }, 0);
    
    currentBalance = opening + movementsSum;
  }

  // 3. Total vendido hoje (somatória de vendas finalizadas nas últimas 24 horas - desde 00:00h)
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  
  const todaySales = await db.sale.findMany({
    where: {
      status: "COMPLETED",
      createdAt: {
        gte: startOfToday,
      },
    },
    select: {
      total: true,
    },
  });

  const todaySold = todaySales.reduce((acc, s) => acc + Number(s.total.toString()), 0);

  // 4. Buscar dados de vendas dos últimos 7 dias para o gráfico
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const salesLast7Days = await db.sale.findMany({
    where: {
      status: "COMPLETED",
      createdAt: {
        gte: sevenDaysAgo,
      },
    },
    select: {
      total: true,
      createdAt: true,
    },
  });

  // Agrupar vendas por dia
  const salesMap = new Map<string, number>();
  salesLast7Days.forEach((sale) => {
    // Formatar como dia da semana curto (ex: "seg", "ter")
    const day = sale.createdAt.toLocaleDateString("pt-BR", { weekday: "short" });
    salesMap.set(day, (salesMap.get(day) ?? 0) + Number(sale.total.toString()));
  });

  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const rawDay = d.toLocaleDateString("pt-BR", { weekday: "short" });
    const formattedDay = rawDay.replace(".", "").toUpperCase();
    chartData.push({
      name: formattedDay,
      valor: salesMap.get(rawDay) ?? 0,
    });
  }

  return (
    <AppShell title="Dashboard">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Visão geral e monitoramento operacional da lanchonete
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink variant="outline" size="sm" href="/relatorios" className="gap-2">
              <FileSpreadsheet className="size-4" /> Relatórios detalhados
            </ButtonLink>
            <div className="rounded-2xl border bg-card px-4 py-2 shadow-sm text-sm font-medium">
              <BrasiliaClock />
            </div>
          </div>
        </div>

        {/* Estatísticas de Operação */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="gap-3">
              <div className="flex items-center justify-between">
                <CardDescription className="font-medium text-xs uppercase tracking-wider">Caixa</CardDescription>
                <span className="grid size-10 place-items-center rounded-2xl border bg-muted/40">
                  <Wallet className="size-4 text-muted-foreground" />
                </span>
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight">
                {cashStatus === "OPEN" ? (
                  <span className="text-emerald-600">Aberto</span>
                ) : (
                  <span className="text-zinc-500">Fechado</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                {openCash ? (
                  <>Aberto em {new Date(openCash.openedAt).toLocaleString("pt-BR")}</>
                ) : lastClosedCash ? (
                  <>Último fechamento: {new Date(lastClosedCash.closedAt!).toLocaleString("pt-BR")}</>
                ) : (
                  "Nenhum caixa operado recentemente"
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-3">
              <div className="flex items-center justify-between">
                <CardDescription className="font-medium text-xs uppercase tracking-wider">Total vendido hoje</CardDescription>
                <span className="grid size-10 place-items-center rounded-2xl border bg-muted/40">
                  <TrendingUp className="size-4 text-muted-foreground" />
                </span>
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight text-primary">
                {formatMoney(todaySold)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Faturamento líquido (vendas concluídas hoje)
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-3">
              <div className="flex items-center justify-between">
                <CardDescription className="font-medium text-xs uppercase tracking-wider">Saldo atual</CardDescription>
                <span className="grid size-10 place-items-center rounded-2xl border bg-muted/40">
                  <Coins className="size-4 text-muted-foreground" />
                </span>
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight">
                {cashStatus === "OPEN" ? formatMoney(currentBalance) : "--"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                {cashStatus === "OPEN" ? (
                  <>Dinheiro em mãos ({movementsCount} movimentações)</>
                ) : (
                  "Abra o caixa na aba lateral para iniciar"
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Vendas e Últimas Movimentações */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Atividade Recente</CardTitle>
              <CardDescription>
                Desempenho de faturamento nos últimos 7 dias operacionais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SalesChart data={chartData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Resumo do Caixa</CardTitle>
              <CardDescription>
                {cashStatus === "OPEN" 
                  ? "Últimas movimentações do caixa atual" 
                  : "Últimas movimentações da sessão anterior"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {recentMovements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-2xl text-center text-muted-foreground px-4">
                    <span className="text-xs font-semibold">Nenhuma movimentação recente</span>
                    <span className="text-[10px] mt-0.5">Vendas e lançamentos aparecerão aqui.</span>
                  </div>
                ) : (
                  recentMovements.map((m) => {
                    const isIncome = ["SUPRIMENTO", "ENTRADA_MANUAL", "VENDA"].includes(m.type);
                    const Icon = isIncome ? ArrowUpRight : ArrowDownRight;
                    
                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between rounded-2xl border bg-background/60 px-4 py-3 shadow-sm hover:bg-muted/10 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`grid size-8 place-items-center rounded-xl ${
                            isIncome 
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                              : "bg-red-50 text-red-600 border border-red-100"
                          }`}>
                            <Icon className="size-4" />
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-xs font-semibold text-zinc-950 uppercase tracking-wide">
                              {m.type === "SUPRIMENTO" ? "Abertura / Entrada" : m.type}
                            </div>
                            <div className="truncate text-[10px] text-muted-foreground">
                              {m.description ?? "Sem descrição"}
                            </div>
                          </div>
                        </div>
                        <div className={`text-xs font-bold whitespace-nowrap ${
                          isIncome ? "text-emerald-700" : "text-red-700"
                        }`}>
                          {isIncome ? "+" : "-"} {formatMoney(m.amount)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

