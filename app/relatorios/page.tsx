import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";
import { getDb } from "@/lib/db";
import { PrintReportButton } from "@/components/relatorios/print-report-button";
import { AnalyticsCharts } from "./analytics-charts";
import { FileText, Coins, Receipt, ArrowDownRight, Tag, TrendingUp } from "lucide-react";

function formatMoney(value: number | string | any) {
  if (value === undefined || value === null) return "--";
  const n = Number(value.toString());
  if (!Number.isFinite(n)) return "--";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; tab?: string }>;
}) {
  const { period = "hoje", tab = "visao_geral" } = await searchParams;
  const db = getDb();

  // 1. Determinar intervalo de datas do filtro
  const now = new Date();
  let gte = new Date();
  let lte = new Date();

  if (period === "hoje") {
    gte = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    lte = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (period === "ontem") {
    gte = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
    lte = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
  } else if (period === "7d") {
    gte = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0);
    lte = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (period === "30d") {
    gte = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0);
    lte = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  }

  // 2. Buscar vendas completadas no intervalo
  const sales = await db.sale.findMany({
    where: {
      status: "COMPLETED",
      createdAt: { gte, lte },
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              cost: true,
              category: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  const payments = await db.payment.findMany({
    where: {
      createdAt: { gte, lte },
    },
  });

  // 3. Processar Indicadores Financeiros
  const grossRevenue = sales.reduce((acc, s) => acc + Number(s.total.toString()), 0);
  
  // Calcular CMV (Custo de Mercadoria Vendida)
  const cogs = sales.reduce((acc, s) => {
    const saleCogs = s.items.reduce((itemAcc, item) => {
      const cost = item.product.cost ? Number(item.product.cost.toString()) : 0;
      return itemAcc + (cost * item.quantity);
    }, 0);
    return acc + saleCogs;
  }, 0);

  const grossProfit = grossRevenue - cogs;
  const profitMargin = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;
  const salesCount = sales.length;
  const averageTicket = salesCount > 0 ? grossRevenue / salesCount : 0;

  // 4. Preparar Dados dos Gráficos
  // Faturamento por dia
  const salesByDayMap = new Map<string, number>();
  sales.forEach((s) => {
    const day = s.createdAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    salesByDayMap.set(day, (salesByDayMap.get(day) ?? 0) + Number(s.total.toString()));
  });
  const salesByDay = Array.from(salesByDayMap.entries())
    .map(([name, valor]) => ({ name, valor }))
    .sort((a, b) => {
      const [dayA, monthA] = a.name.split("/").map(Number);
      const [dayB, monthB] = b.name.split("/").map(Number);
      return monthA !== monthB ? monthA - monthB : dayA - dayB;
    });

  // Quantidade e faturamento por categoria de produto
  const categoryMap = new Map<string, { quantity: number; total: number }>();
  sales.forEach((s) => {
    s.items.forEach((item) => {
      const catName = item.product.category?.name ?? "Outros";
      const current = categoryMap.get(catName) ?? { quantity: 0, total: 0 };
      current.quantity += item.quantity;
      current.total += Number(item.total.toString());
      categoryMap.set(catName, current);
    });
  });
  const salesByCategory = Array.from(categoryMap.entries()).map(([name, data]) => ({
    name,
    quantidade: data.quantity,
    valor: data.total,
  }));

  // Distribuição por meio de pagamento
  const paymentMap = new Map<string, number>();
  payments.forEach((p) => {
    const pmName = p.method.replace(/_/g, " ");
    paymentMap.set(pmName, (paymentMap.get(pmName) ?? 0) + Number(p.amount.toString()));
  });
  const salesByPayment = Array.from(paymentMap.entries()).map(([name, valor]) => ({
    name,
    valor,
  }));

  // 5. Histórico de Fechamento de Caixas
  const pastRegisters = await db.cashRegister.findMany({
    orderBy: { openedAt: "desc" },
    include: {
      openedBy: { select: { name: true, email: true } },
      closedBy: { select: { name: true, email: true } },
      movements: true,
      closings: {
        include: {
          methods: true,
        },
      },
    },
    take: 15,
  });

  return (
    <AppShell title="Relatórios">
      <div className="flex flex-col gap-6">
        
        {/* Cabeçalho de Filtros */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between no-print">
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "Hoje", value: "hoje" },
              { label: "Ontem", value: "ontem" },
              { label: "Últimos 7 dias", value: "7d" },
              { label: "Últimos 30 dias", value: "30d" },
            ].map((p) => (
              <ButtonLink
                key={p.value}
                href={`/relatorios?period=${p.value}&tab=${tab}`}
                variant={period === p.value ? "default" : "outline"}
                size="sm"
                className="rounded-xl cursor-pointer"
              >
                {p.label}
              </ButtonLink>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <PrintReportButton />
          </div>
        </div>

        {/* Abas Segmentadas (Segmented Control) */}
        <div className="flex no-print">
          <div className="inline-flex items-center gap-1 rounded-xl bg-muted/60 p-1 border border-black/[0.03] shadow-inner shadow-black/5">
            <ButtonLink
              href={`/relatorios?period=${period}&tab=visao_geral`}
              variant="ghost"
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                tab === "visao_geral"
                  ? "bg-background text-zinc-950 shadow-sm border border-black/[0.03]"
                  : "text-muted-foreground hover:text-zinc-800 hover:bg-transparent"
              }`}
            >
              📊 Visão Geral das Vendas
            </ButtonLink>
            <ButtonLink
              href={`/relatorios?period=${period}&tab=caixas`}
              variant="ghost"
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                tab === "caixas"
                  ? "bg-background text-zinc-950 shadow-sm border border-black/[0.03]"
                  : "text-muted-foreground hover:text-zinc-800 hover:bg-transparent"
              }`}
            >
              📂 Histórico e Fechamento de Caixas
            </ButtonLink>
          </div>
        </div>

        {tab === "visao_geral" ? (
          <>
            {/* Grid dos KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              <Card className="p-4 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute right-2 top-2 text-primary/10 group-hover:text-primary/20 group-hover:scale-110 transition-all duration-300 pointer-events-none">
                  <TrendingUp className="size-10" />
                </div>
                <div className="z-10">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Faturamento</div>
                  <div className="text-lg font-extrabold text-zinc-950 mt-1">{formatMoney(grossRevenue)}</div>
                </div>
                <div className="text-[9px] text-muted-foreground mt-3 z-10">Total vendido</div>
              </Card>

              <Card className="p-4 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute right-2 top-2 text-red-500/10 group-hover:text-red-500/20 group-hover:scale-110 transition-all duration-300 pointer-events-none">
                  <ArrowDownRight className="size-10" />
                </div>
                <div className="z-10">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Custo (CMV)</div>
                  <div className="text-lg font-extrabold text-zinc-950 mt-1">{formatMoney(cogs)}</div>
                </div>
                <div className="text-[9px] text-muted-foreground mt-3 z-10">Custo dos insumos</div>
              </Card>

              <Card className="p-4 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute right-2 top-2 text-emerald-500/10 group-hover:text-emerald-500/20 group-hover:scale-110 transition-all duration-300 pointer-events-none">
                  <Coins className="size-10" />
                </div>
                <div className="z-10">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Lucro Bruto</div>
                  <div className="text-lg font-extrabold text-emerald-600 mt-1">{formatMoney(grossProfit)}</div>
                </div>
                <div className="text-[9px] text-muted-foreground mt-3 z-10">Faturamento - Custo</div>
              </Card>

              <Card className="p-4 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute right-2 top-2 text-purple-500/10 group-hover:text-purple-500/20 group-hover:scale-110 transition-all duration-300 pointer-events-none">
                  <Tag className="size-10" />
                </div>
                <div className="z-10">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Margem de Lucro</div>
                  <div className="text-lg font-extrabold text-zinc-950 mt-1">{profitMargin.toFixed(1)}%</div>
                </div>
                <div className="text-[9px] text-muted-foreground mt-3 z-10">Rentabilidade bruta</div>
              </Card>

              <Card className="p-4 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute right-2 top-2 text-amber-500/10 group-hover:text-amber-500/20 group-hover:scale-110 transition-all duration-300 pointer-events-none">
                  <Receipt className="size-10" />
                </div>
                <div className="z-10">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Ticket Médio</div>
                  <div className="text-lg font-extrabold text-zinc-950 mt-1">{formatMoney(averageTicket)}</div>
                </div>
                <div className="text-[9px] text-muted-foreground mt-3 z-10">Média por pedido</div>
              </Card>

              <Card className="p-4 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute right-2 top-2 text-blue-500/10 group-hover:text-blue-500/20 group-hover:scale-110 transition-all duration-300 pointer-events-none">
                  <FileText className="size-10" />
                </div>
                <div className="z-10">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Qtd Pedidos</div>
                  <div className="text-lg font-extrabold text-zinc-950 mt-1">{salesCount}</div>
                </div>
                <div className="text-[9px] text-muted-foreground mt-3 z-10">Total de pedidos</div>
              </Card>
            </div>

            {/* Gráficos Interativos */}
            <div className="mt-2">
              <AnalyticsCharts
                salesByDay={salesByDay}
                salesByCategory={salesByCategory}
                salesByPayment={salesByPayment}
              />
            </div>
          </>
        ) : (
          /* Tabela Auditada do Histórico de Caixas */
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Auditoria de Caixas Anteriores</CardTitle>
              <CardDescription>
                Controle detalhado de diferenças, quebras e sobras dos fechamentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pastRegisters.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  Nenhum caixa foi aberto ou fechado no sistema.
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border bg-background/60">
                  <div className="grid grid-cols-12 gap-3 border-b bg-muted/40 px-4 py-3 text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                    <div className="col-span-3">Operador / Período</div>
                    <div className="col-span-2 text-right">Fundo Inicial</div>
                    <div className="col-span-2 text-right">Saldo Esperado</div>
                    <div className="col-span-2 text-right">Fechamento Real</div>
                    <div className="col-span-2 text-right">Diferença (Quebra/Sobra)</div>
                    <div className="col-span-1 text-center">Caixa</div>
                  </div>

                  <div className="divide-y">
                    {pastRegisters.map((reg) => {
                      const opening = Number(reg.openingBalance.toString());
                      
                      const closing = reg.closings[0];
                      let expected = 0;
                      let reported = 0;
                      let difference = 0;
                      
                      if (closing) {
                        closing.methods.forEach((m) => {
                          expected += Number(m.expectedValue.toString());
                          reported += Number(m.declaredValue.toString());
                          difference += Number(m.difference.toString());
                        });
                      }

                      return (
                        <div
                          key={reg.id}
                          className="grid grid-cols-12 items-center gap-3 px-4 py-3.5 text-xs hover:bg-muted/10 transition-colors"
                        >
                          {/* Operador & Período */}
                          <div className="col-span-3 min-w-0">
                            <div className="font-bold text-zinc-950 truncate">
                              {reg.openedBy.name ?? reg.openedBy.email}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 whitespace-nowrap">
                              Aberto: {new Date(reg.openedAt).toLocaleDateString("pt-BR")} às {new Date(reg.openedAt).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            {reg.closedAt && (
                              <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                                Fechado: {new Date(reg.closedAt).toLocaleDateString("pt-BR")} às {new Date(reg.closedAt).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>

                          {/* Fundo Inicial */}
                          <div className="col-span-2 text-right font-semibold text-zinc-700">
                            {formatMoney(opening)}
                          </div>

                          {/* Saldo Esperado */}
                          <div className="col-span-2 text-right font-semibold text-zinc-700">
                            {reg.status === "CLOSED" ? formatMoney(expected) : "--"}
                          </div>

                          {/* Fechamento Real */}
                          <div className="col-span-2 text-right font-semibold text-zinc-950">
                            {reg.status === "CLOSED" ? formatMoney(reported) : "Aberto"}
                          </div>

                          {/* Diferença */}
                          <div className="col-span-2 text-right">
                            {reg.status === "CLOSED" ? (
                              difference > 0.009 ? (
                                <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                                  +{formatMoney(difference)} (Sobra)
                                </span>
                              ) : difference < -0.009 ? (
                                <span className="inline-flex items-center rounded-lg bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700 border border-red-100">
                                  {formatMoney(difference)} (Quebra)
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-lg bg-zinc-50 px-2 py-1 text-[10px] font-bold text-zinc-600 border border-zinc-200">
                                  Exato
                                </span>
                              )
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </div>

                          {/* Status */}
                          <div className="col-span-1 text-center">
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                reg.status === "OPEN"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-zinc-50 text-zinc-600 border-zinc-200"
                              }`}
                            >
                              {reg.status === "OPEN" ? "Ativo" : "Fechado"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

