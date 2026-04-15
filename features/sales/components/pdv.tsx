"use client";

import { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";

import { createSaleAction } from "@/app/vendas/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Product = {
  id: string;
  name: string;
  price: string;
  active: boolean;
  category?: { id: string; name: string } | null;
};

type PaymentMethod = {
  id: string;
  name: string;
  kind: "CASH" | "PIX" | "CARD" | "OTHER";
  active: boolean;
};

function toNumberBR(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".").trim();
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function Pdv({
  products,
  paymentMethods,
  cashOpen,
}: {
  products: Product[];
  paymentMethods: PaymentMethod[];
  cashOpen: boolean;
}) {
  const search = useSearchParams();
  const success = search.get("success") === "1";

  const [query, setQuery] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [discount, setDiscount] = useState("0");
  const [deliveryFee, setDeliveryFee] = useState("0");
  const [notes, setNotes] = useState("");

  const [cart, setCart] = useState<Record<string, number>>({});
  const [payments, setPayments] = useState<Array<{ paymentMethodId: string; amount: string }>>([
    { paymentMethodId: paymentMethods[0]?.id ?? "", amount: "0" },
  ]);

  const [cashReceived, setCashReceived] = useState("0");

  const [step, setStep] = useState<"editing" | "confirm">("editing");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, query]);

  const cartItems = useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p] as const));
    return Object.entries(cart)
      .map(([productId, quantity]) => {
        const p = byId.get(productId);
        if (!p) return null;
        const price = Number(p.price);
        return {
          productId,
          name: p.name,
          price,
          quantity,
          total: price * quantity,
        };
      })
      .filter(Boolean) as Array<{ productId: string; name: string; price: number; quantity: number; total: number }>;
  }, [cart, products]);

  const subtotal = useMemo(() => cartItems.reduce((acc, i) => acc + i.total, 0), [cartItems]);
  const discountN = toNumberBR(discount);
  const deliveryN = toNumberBR(deliveryFee);
  const total = Math.max(0, subtotal - discountN + deliveryN);

  const paymentSum = useMemo(
    () => payments.reduce((acc, p) => acc + toNumberBR(p.amount), 0),
    [payments],
  );

  const cashIds = useMemo(
    () => new Set(paymentMethods.filter((m) => m.kind === "CASH").map((m) => m.id)),
    [paymentMethods],
  );
  const hasCash = useMemo(
    () => payments.some((p) => cashIds.has(p.paymentMethodId)),
    [payments, cashIds],
  );
  const cashReceivedN = toNumberBR(cashReceived);
  const changeDue = hasCash ? Math.max(0, cashReceivedN - total) : 0;

  function addToCart(productId: string) {
    setCart((prev) => ({ ...prev, [productId]: (prev[productId] ?? 0) + 1 }));
  }

  function setQty(productId: string, qty: number) {
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[productId];
      else next[productId] = qty;
      return next;
    });
  }

  function addPaymentRow() {
    setPayments((prev) => [...prev, { paymentMethodId: paymentMethods[0]?.id ?? "", amount: "0" }]);
  }

  function removePaymentRow(idx: number) {
    setPayments((prev) => prev.filter((_, i) => i !== idx));
  }

  function validate() {
    if (!cashOpen) {
      return "Abra o caixa antes de realizar vendas";
    }
    if (cartItems.length === 0) {
      return "Adicione pelo menos 1 item na venda.";
    }
    if (discountN < 0 || deliveryN < 0) {
      return "Valores inválidos.";
    }
    if (discountN > subtotal) {
      return "Desconto não pode ser maior que o subtotal.";
    }
    if (payments.length === 0) {
      return "Informe pelo menos 1 pagamento.";
    }
    if (Math.abs(paymentSum - total) > 0.009) {
      return "A soma dos pagamentos deve ser igual ao total.";
    }
    const anyMissing = payments.some((p) => !p.paymentMethodId);
    if (anyMissing) return "Selecione o método de pagamento.";
    const anyZero = payments.some((p) => toNumberBR(p.amount) <= 0);
    if (anyZero) return "Pagamento com valor inválido.";

    if (hasCash && cashReceivedN < total) {
      return "Valor recebido em dinheiro deve ser maior ou igual ao total.";
    }

    return null;
  }

  function goConfirm() {
    setError(null);
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setStep("confirm");
  }

  function finalize() {
    setError(null);
    const err = validate();
    if (err) {
      setError(err);
      setStep("editing");
      return;
    }

    startTransition(() => {
      createSaleAction({
        customerName: customerName.trim() || undefined,
        notes: notes.trim() || undefined,
        discount,
        deliveryFee,
        cashReceived: hasCash ? cashReceived : undefined,
        items: cartItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        payments,
      }).catch((e) => {
        setError(e instanceof Error ? e.message : "Erro ao finalizar venda.");
        setStep("editing");
      });
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Produtos</CardTitle>
          <CardDescription>
            Busque e adicione itens à venda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="mb-4 rounded-2xl border bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Venda registrada com sucesso.
            </div>
          ) : null}

          <div className="grid gap-3">
            <Input
              placeholder="Buscar produto..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <div className="overflow-hidden rounded-2xl border bg-background/60">
              <div className="grid grid-cols-12 gap-3 border-b bg-muted/40 px-4 py-3 text-xs font-medium text-muted-foreground">
                <div className="col-span-7">Produto</div>
                <div className="col-span-3 text-right">Preço</div>
                <div className="col-span-2 text-right">Ação</div>
              </div>
              <div className="divide-y">
                {filtered.map((p) => (
                  <div
                    key={p.id}
                    className="grid grid-cols-12 items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/30"
                  >
                    <div className="col-span-7 min-w-0">
                      <div className="truncate font-medium">{p.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {p.category?.name ?? "—"}
                      </div>
                    </div>
                    <div className="col-span-3 text-right font-semibold">
                      {formatMoney(Number(p.price))}
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <Button variant="outline" size="sm" onClick={() => addToCart(p.id)}>
                        Adicionar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Venda</CardTitle>
          <CardDescription>
            Cliente, desconto, entrega e pagamento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!cashOpen ? (
            <div className="mb-4 rounded-2xl border bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Abra o caixa antes de realizar vendas.
            </div>
          ) : null}

          {error ? (
            <div className="mb-4 rounded-2xl border bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Cliente (opcional)</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nome do cliente" />
            </div>

            <div className="grid gap-2">
              <Label>Observações (opcional)</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: sem cebola, retirar no balcão" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Desconto (R$)</Label>
                <Input value={discount} onChange={(e) => setDiscount(e.target.value)} inputMode="decimal" />
              </div>
              <div className="grid gap-2">
                <Label>Taxa de entrega (R$)</Label>
                <Input value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} inputMode="decimal" />
              </div>
            </div>

            <div className="rounded-2xl border bg-background/60 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatMoney(subtotal)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Desconto</span>
                <span className="font-semibold">{formatMoney(discountN)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Entrega</span>
                <span className="font-semibold">{formatMoney(deliveryN)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t pt-3">
                <span className="text-sm font-medium">Total</span>
                <span className="text-lg font-semibold tracking-tight">{formatMoney(total)}</span>
              </div>

              {hasCash ? (
                <div className="mt-4 grid gap-3">
                  <div className="grid gap-2">
                    <Label>Valor recebido (DINHEIRO)</Label>
                    <Input
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      inputMode="decimal"
                      placeholder="0,00"
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border bg-background px-4 py-3">
                    <div>
                      <div className="text-xs font-medium text-muted-foreground">Troco</div>
                      <div className="text-lg font-semibold tracking-tight">
                        {formatMoney(changeDue)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Recebido</div>
                      <div className="text-sm font-semibold">
                        {formatMoney(cashReceivedN)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Pagamentos</div>
                  <div className="text-xs text-muted-foreground">A soma precisa fechar o total.</div>
                </div>
                <Button variant="outline" size="sm" onClick={addPaymentRow}>
                  +
                </Button>
              </div>

              <div className="grid gap-2">
                {payments.map((p, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2">
                    <div className="col-span-7">
                      <select
                        value={p.paymentMethodId}
                        onChange={(e) =>
                          setPayments((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, paymentMethodId: e.target.value } : x)),
                          )
                        }
                        className="h-10 w-full rounded-xl border border-input bg-background/60 px-3 text-sm shadow-sm shadow-black/5 outline-none focus-visible:ring-3 focus-visible:ring-ring/35"
                      >
                        {paymentMethods
                          .filter((m) => m.active)
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="col-span-4">
                      <Input
                        value={p.amount}
                        onChange={(e) =>
                          setPayments((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, amount: e.target.value } : x)),
                          )
                        }
                        inputMode="decimal"
                        placeholder="0,00"
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remover"
                        onClick={() => removePaymentRow(idx)}
                        disabled={payments.length === 1}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between rounded-2xl border bg-background/60 px-4 py-3 text-sm">
                <span className="text-muted-foreground">Soma</span>
                <span className={Math.abs(paymentSum - total) < 0.009 ? "font-semibold" : "font-semibold text-red-600"}>
                  {formatMoney(paymentSum)}
                </span>
              </div>
            </div>

            {step === "editing" ? (
              <Button onClick={goConfirm} disabled={isPending}>
                Confirmar
              </Button>
            ) : (
              <div className="grid gap-2">
                <div className="rounded-2xl border bg-muted/40 px-4 py-3 text-sm">
                  <div className="font-medium">Confirmar venda</div>
                  <div className="mt-1 text-muted-foreground">
                    {cartItems.length} itens • Total {formatMoney(total)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => setStep("editing")} disabled={isPending}>
                    Voltar
                  </Button>
                  <Button onClick={finalize} disabled={isPending}>
                    {isPending ? "Finalizando..." : "Finalizar"}
                  </Button>
                </div>
              </div>
            )}

            <div className="rounded-2xl border bg-background/60 p-4">
              <div className="text-sm font-medium">Itens</div>
              {cartItems.length === 0 ? (
                <div className="mt-2 text-sm text-muted-foreground">
                  Nenhum item.
                </div>
              ) : (
                <div className="mt-2 grid gap-2">
                  {cartItems.map((i) => (
                    <div key={i.productId} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{i.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatMoney(i.price)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setQty(i.productId, i.quantity - 1)}>
                          -
                        </Button>
                        <div className="w-8 text-center text-sm font-semibold">
                          {i.quantity}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setQty(i.productId, i.quantity + 1)}>
                          +
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
