import { AppShell } from "@/components/shell/app-shell";
import { Pdv } from "@/features/sales/components/pdv";
import { SaleRowActions } from "@/features/sales/components/sale-row-actions";
import { getCurrentCashRegister } from "@/server/cash/cash-service";
import { getDb } from "@/lib/db";
import { Suspense } from "react";

export default async function VendasPage() {
  const db = getDb();
  const cash = await getCurrentCashRegister();

  const recentSales = cash
    ? await db.sale.findMany({
        where: { cashRegisterId: cash.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          status: true,
          total: true,
          createdAt: true,
          customerName: true,
        },
      })
    : [];

  const [products, paymentMethods] = await Promise.all([
    db.product.findMany({
      where: { active: true },
      orderBy: [{ name: "asc" }],
      include: { category: true },
    }),
    db.paymentMethod.findMany({
      where: { active: true },
      orderBy: [{ name: "asc" }],
    }),
  ]);

  return (
    <AppShell title="Vendas">
      <Suspense>
        <Pdv
          cashOpen={Boolean(cash)}
          products={products.map((p: (typeof products)[number]) => ({
            id: p.id,
            name: p.name,
            price: p.price.toString(),
            active: p.active,
            category: p.category ? { id: p.category.id, name: p.category.name } : null,
          }))}
          paymentMethods={paymentMethods.map((m: (typeof paymentMethods)[number]) => {
            const kind = (
              m as unknown as {
                kind?: "CASH" | "PIX" | "CARD" | "OTHER";
              }
            ).kind;
            return {
              id: m.id,
              name: m.name,
              kind: kind ?? "CASH",
              active: m.active,
            };
          })}
        />
      </Suspense>

      <div className="mt-6 overflow-hidden rounded-2xl border bg-background/60">
        <div className="grid grid-cols-12 gap-3 border-b bg-muted/40 px-4 py-3 text-xs font-medium text-muted-foreground">
          <div className="col-span-3">Data</div>
          <div className="col-span-3">Cliente</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Total</div>
          <div className="col-span-2 text-right">Ações</div>
        </div>

        {recentSales.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <div className="text-sm font-medium">Sem vendas recentes</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {cash ? "Finalize uma venda para aparecer aqui." : "Abra o caixa para começar."}
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {recentSales.map((s: (typeof recentSales)[number]) => (
              <div
                key={s.id}
                className="grid grid-cols-12 items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/30"
              >
                <div className="col-span-3 text-muted-foreground">
                  {new Date(s.createdAt).toLocaleString("pt-BR")}
                </div>
                <div className="col-span-3 truncate text-muted-foreground">
                  {s.customerName ?? "—"}
                </div>
                <div className="col-span-2">
                  <span
                    className={
                      s.status === "COMPLETED"
                        ? "inline-flex items-center rounded-full border bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                        : "inline-flex items-center rounded-full border bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700"
                    }
                  >
                    {s.status === "COMPLETED" ? "FINALIZADA" : "CANCELADA"}
                  </span>
                </div>
                <div className="col-span-2 text-right font-semibold">
                  {Number(s.total.toString()).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </div>
                <div className="col-span-2 flex justify-end">
                  {s.status === "COMPLETED" && cash ? (
                    <SaleRowActions saleId={s.id} />
                  ) : (
                    <div className="text-xs text-muted-foreground">—</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
