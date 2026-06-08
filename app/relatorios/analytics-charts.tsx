"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const formatMoney = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const COLORS = ["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#f59e0b"];

export function AnalyticsCharts({
  salesByDay,
  salesByCategory,
  salesByPayment,
}: {
  salesByDay: Array<{ name: string; valor: number }>;
  salesByCategory: Array<{ name: string; quantidade: number; valor: number }>;
  salesByPayment: Array<{ name: string; valor: number }>;
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-[280px] bg-muted/10 animate-pulse rounded-2xl" />
        <div className="h-[280px] bg-muted/10 animate-pulse rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Gráfico 1: Histórico de Faturamento */}
      <div className="rounded-2xl border bg-background/60 p-4">
        <h4 className="text-sm font-semibold text-zinc-900 mb-4">Faturamento ao Longo do Período</h4>
        {salesByDay.length === 0 ? (
          <div className="h-[240px] flex items-center justify-center text-xs text-muted-foreground">
            Sem vendas no período.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={salesByDay} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#888", fontSize: 10 }} tickFormatter={(v) => `R$${v}`} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => [formatMoney(Number(v)), "Faturamento"]}
                contentStyle={{
                  background: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                  borderRadius: "12px",
                }}
              />
              <Area type="monotone" dataKey="valor" stroke="#f97316" strokeWidth={2} fill="url(#colorFaturamento)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Gráfico 2: Divisão por Meios de Pagamento */}
      <div className="rounded-2xl border bg-background/60 p-4">
        <h4 className="text-sm font-semibold text-zinc-900 mb-4">Faturamento por Método de Pagamento</h4>
        {salesByPayment.length === 0 ? (
          <div className="h-[240px] flex items-center justify-center text-xs text-muted-foreground">
            Sem dados de pagamento no período.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={salesByPayment}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="valor"
              >
                {salesByPayment.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => [formatMoney(Number(v)), "Total"]}
                contentStyle={{
                  background: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                  borderRadius: "12px",
                }}
              />
              <Legend verticalAlign="bottom" height={36} iconSize={10} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Gráfico 3: Categorias Mais Vendidas */}
      <div className="rounded-2xl border bg-background/60 p-4 md:col-span-2">
        <h4 className="text-sm font-semibold text-zinc-900 mb-4">Vendas por Categoria</h4>
        {salesByCategory.length === 0 ? (
          <div className="h-[240px] flex items-center justify-center text-xs text-muted-foreground">
            Sem itens vendidos no período.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={salesByCategory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" orientation="left" stroke="#f97316" tick={{ fill: "#888", fontSize: 10 }} tickFormatter={(v) => `R$${v}`} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" tick={{ fill: "#888", fontSize: 10 }} tickFormatter={(v) => `${v} un`} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                  borderRadius: "12px",
                }}
              />
              <Bar yAxisId="left" dataKey="valor" name="Faturamento (R$)" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar yAxisId="right" dataKey="quantidade" name="Qtd Vendida (un)" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
