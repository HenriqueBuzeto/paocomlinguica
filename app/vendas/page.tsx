import { AppShell } from "@/components/shell/app-shell";
import { Pdv } from "@/features/sales/components/pdv";
import { getCurrentCashRegister } from "@/server/cash/cash-service";
import { getDb } from "@/lib/db";
import { Suspense } from "react";

export default async function VendasPage() {
  const db = getDb();
  const cash = await getCurrentCashRegister();

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
    </AppShell>
  );
}
