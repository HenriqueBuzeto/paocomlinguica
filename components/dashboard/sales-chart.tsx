"use client";

import { useEffect, useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const formatMoney = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function SalesChart({ data }: { data: Array<{ name: string; valor: number }> }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-[260px] w-full flex items-center justify-center bg-muted/10 rounded-2xl">
        <span className="text-sm text-muted-foreground animate-pulse">Carregando gráfico...</span>
      </div>
    );
  }

  // Check if data is empty or all zero
  const isDataEmpty = data.every((d) => d.valor === 0);

  if (isDataEmpty) {
    return (
      <div className="h-[260px] w-full flex flex-col items-center justify-center bg-muted/10 border border-dashed rounded-2xl p-6 text-center">
        <span className="text-sm font-medium text-muted-foreground">Nenhuma venda registrada nos últimos 7 dias</span>
        <span className="text-xs text-muted-foreground/80 mt-1">Abra o caixa e realize vendas para ver o histórico aqui.</span>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
        <defs>
          <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#888", fontSize: 11 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#888", fontSize: 11 }}
          tickFormatter={(v) => `R$${v}`}
        />
        <Tooltip
          formatter={(value: any) => [formatMoney(Number(value)), "Vendas"]}
          contentStyle={{
            background: "rgba(255, 255, 255, 0.96)",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            borderRadius: "12px",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
          }}
        />
        <Area
          type="monotone"
          dataKey="valor"
          stroke="#f97316"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorValor)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
