import { notFound } from "next/navigation";
import { Suspense } from "react";

import { getDb } from "@/lib/db";
import { PrintControls } from "@/features/sales/components/print-controls";

function formatMoney(value: unknown) {
  const safe =
    value && typeof value === "object" && "toString" in value
      ? (value as { toString: () => string }).toString()
      : value;
  const n = Number(safe);
  if (!Number.isFinite(n)) return "--";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(value);
}

export default async function ComprovantePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ format?: string }>;
}) {
  const { id } = await params;
  const { format } = await searchParams;
  const mode = format === "a4" ? "a4" : "80mm";

  const db = getDb();
  const sale = await db.sale.findUnique({
    where: { id },
    include: {
      operator: { select: { name: true, email: true } },
      items: { include: { product: { select: { name: true } } } },
      payments: { include: { paymentMethod: { select: { name: true, kind: true } } } },
    },
  });

  if (!sale) return notFound();

  const subtotal = sale.items.reduce(
    (acc: number, i: (typeof sale.items)[number]) => acc + Number(i.total.toString()),
    0,
  );
  const discount = Number(sale.discount.toString());
  const deliveryFee = Number(sale.deliveryFee.toString());
  const total = Number(sale.total.toString());
  const extra = sale as unknown as {
    cashReceived?: { toString: () => string } | null;
    changeDue?: { toString: () => string } | null;
  };
  const cashReceived = extra.cashReceived ? Number(extra.cashReceived.toString()) : null;
  const changeDue = extra.changeDue ? Number(extra.changeDue.toString()) : null;

  const containerClass =
    mode === "80mm"
      ? "mx-auto w-[80mm] bg-white p-3 text-[11px] text-zinc-900"
      : "mx-auto w-full max-w-[210mm] bg-white p-8 text-sm text-zinc-900";

  return (
    <div className="min-h-dvh bg-white">
      <div className="mx-auto w-full max-w-4xl px-4 py-6">
        <Suspense>
          <PrintControls />
        </Suspense>
      </div>

      <div className={containerClass}>
        <div className="text-center">
          <div className={mode === "80mm" ? "text-sm font-semibold" : "text-2xl font-semibold"}>
            Pão com Linguiça
          </div>
          <div className={mode === "80mm" ? "mt-0.5 text-[10px] text-zinc-600" : "mt-1 text-sm text-zinc-600"}>
            Comprovante de venda
          </div>
        </div>

        <div className={mode === "80mm" ? "mt-3" : "mt-6"}>
          <div className="flex items-center justify-between">
            <span className="text-zinc-600">Venda</span>
            <span className="font-mono">{sale.id.slice(-8).toUpperCase()}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-zinc-600">Data</span>
            <span>{formatDate(sale.createdAt)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-zinc-600">Operador</span>
            <span className="truncate">{sale.operator.name ?? sale.operator.email}</span>
          </div>
          {sale.customerName ? (
            <div className="mt-1 flex items-center justify-between">
              <span className="text-zinc-600">Cliente</span>
              <span className="truncate">{sale.customerName}</span>
            </div>
          ) : null}
          {sale.status === "CANCELED" ? (
            <div className={mode === "80mm" ? "mt-2 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-center text-[10px] font-semibold text-red-700" : "mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-sm font-semibold text-red-700"}>
              VENDA CANCELADA
            </div>
          ) : null}
        </div>

        <div className={mode === "80mm" ? "mt-3 border-t pt-2" : "mt-6 border-t pt-4"}>
          <div className={mode === "80mm" ? "text-[10px] font-medium text-zinc-600" : "text-xs font-medium text-zinc-600"}>
            ITENS
          </div>
          <div className={mode === "80mm" ? "mt-1 grid gap-1" : "mt-2 grid gap-2"}>
            {sale.items.map((i: (typeof sale.items)[number]) => (
              <div key={i.id} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-medium">{i.product.name}</div>
                  <div className="text-zinc-600">
                    {i.quantity} x {formatMoney(i.unitPrice)}
                  </div>
                </div>
                <div className="font-semibold">{formatMoney(i.total)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={mode === "80mm" ? "mt-3 border-t pt-2" : "mt-6 border-t pt-4"}>
          <div className="grid gap-1">
            <div className="flex items-center justify-between">
              <span className="text-zinc-600">Subtotal</span>
              <span className="font-semibold">{formatMoney(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-600">Desconto</span>
              <span className="font-semibold">{formatMoney(discount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-600">Entrega</span>
              <span className="font-semibold">{formatMoney(deliveryFee)}</span>
            </div>
            <div className={mode === "80mm" ? "mt-1 flex items-center justify-between border-t pt-2" : "mt-2 flex items-center justify-between border-t pt-3"}>
              <span className="font-medium">TOTAL</span>
              <span className={mode === "80mm" ? "text-sm font-semibold" : "text-xl font-semibold"}>
                {formatMoney(total)}
              </span>
            </div>
          </div>

          <div className={mode === "80mm" ? "mt-3" : "mt-6"}>
            <div className={mode === "80mm" ? "text-[10px] font-medium text-zinc-600" : "text-xs font-medium text-zinc-600"}>
              PAGAMENTOS
            </div>
            <div className={mode === "80mm" ? "mt-1 grid gap-1" : "mt-2 grid gap-2"}>
              {sale.payments.map((p: (typeof sale.payments)[number]) => (
                <div key={p.id} className="flex items-center justify-between">
                  <span className="text-zinc-600">{p.paymentMethod.name}</span>
                  <span className="font-semibold">{formatMoney(p.amount)}</span>
                </div>
              ))}

              {cashReceived !== null ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600">Recebido (DINHEIRO)</span>
                    <span className="font-semibold">{formatMoney(cashReceived)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600">Troco</span>
                    <span className="font-semibold">{formatMoney(changeDue ?? 0)}</span>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {sale.notes ? (
            <div className={mode === "80mm" ? "mt-3 border-t pt-2" : "mt-6 border-t pt-4"}>
              <div className={mode === "80mm" ? "text-[10px] font-medium text-zinc-600" : "text-xs font-medium text-zinc-600"}>
                OBSERVAÇÕES
              </div>
              <div className={mode === "80mm" ? "mt-1" : "mt-2"}>{sale.notes}</div>
            </div>
          ) : null}

          <div className={mode === "80mm" ? "mt-4 text-center text-[10px] text-zinc-500" : "mt-8 text-center text-xs text-zinc-500"}>
            Obrigado e bom apetite.
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}
