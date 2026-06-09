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

const categoryEmojis: Record<string, string> = {
  "lanche": "🍔",
  "lanches": "🍔",
  "hamburguer": "🍔",
  "hambúrguer": "🍔",
  "pao": "🥖",
  "pão": "🥖",
  "bebida": "🥤",
  "bebidas": "🥤",
  "acompanhamento": "🍟",
  "acompanhamentos": "🍟",
  "porcao": "🍟",
  "porção": "🍟",
  "porcoes": "🍟",
  "porções": "🍟",
  "sobremesa": "🍰",
  "sobremesas": "🍰",
  "doce": "🍩",
  "doces": "🍩",
  "suco": "🍹",
  "sucos": "🍹",
  "adicional": "➕",
  "adicionais": "➕",
};

function getCategoryEmoji(name: string) {
  const norm = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return categoryEmojis[norm] || categoryEmojis[name.toLowerCase()] || "📦";
}

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
  const lastSaleId = search.get("lastSaleId");

  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
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

  // Categorias de produtos ativas
  const categoriesList = useMemo(() => {
    const catsMap = new Map<string, { id: string; name: string }>();
    products.forEach((p) => {
      if (p.category) {
        catsMap.set(p.category.id, p.category);
      }
    });
    return Array.from(catsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  // Filtragem de produtos por categoria e termo de busca
  const filtered = useMemo(() => {
    let result = products;
    if (selectedCategory !== "all") {
      result = products.filter((p) => p.category?.id === selectedCategory);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }
    return result;
  }, [products, selectedCategory, query]);

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
    const currentSum = payments.reduce((acc, p) => acc + toNumberBR(p.amount), 0);
    const remaining = Math.max(0, total - currentSum);
    // Formata o saldo restante como padrão pt-BR decimal
    const remainingStr = remaining.toFixed(2).replace(".", ",");
    setPayments((prev) => [...prev, { paymentMethodId: paymentMethods[0]?.id ?? "", amount: remainingStr }]);
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
        payments: payments.map(p => ({
          paymentMethodId: p.paymentMethodId,
          amount: p.amount.replace(",", ".")
        })),
      }).catch((e) => {
        setError(e instanceof Error ? e.message : "Erro ao finalizar venda.");
        setStep("editing");
      });
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Modal pós-venda para impressão de comprovante */}
      {success && lastSaleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-white/20 bg-background/95 p-6 shadow-2xl animate-in fade-in duration-200">
            <div className="text-center">
              <span className="grid mx-auto size-14 place-items-center rounded-full bg-emerald-100 text-emerald-600 text-2xl mb-4">
                ✓
              </span>
              <h3 className="text-lg font-bold text-zinc-950">Venda Realizada com Sucesso!</h3>
              <p className="text-xs text-muted-foreground mt-1 px-4">
                Deseja emitir e imprimir o comprovante/cupom fiscal desta venda agora?
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-6">
              <a
                href={`/vendas/${lastSaleId}/comprovante?format=80mm`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl border bg-background px-4 py-3 text-xs font-bold text-zinc-800 hover:bg-muted/30 transition-colors shadow-sm"
              >
                🖨️ Cupom 80mm
              </a>
              <a
                href={`/vendas/${lastSaleId}/comprovante?format=a4`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl border bg-background px-4 py-3 text-xs font-bold text-zinc-800 hover:bg-muted/30 transition-colors shadow-sm"
              >
                📄 Nota A4
              </a>
            </div>
            
            <button
              onClick={() => {
                // Limpa os parâmetros de busca para fechar o modal
                window.history.replaceState({}, document.title, window.location.pathname);
                // Reseta carrinho e estados do PDV
                setCart({});
                setCustomerName("");
                setNotes("");
                setDiscount("0");
                setDeliveryFee("0");
                setCashReceived("0");
                setStep("editing");
                window.location.reload();
              }}
              className="mt-4 w-full rounded-2xl bg-primary py-3 text-xs font-bold text-white shadow-md hover:bg-primary/95 transition-colors cursor-pointer"
            >
              Nova Venda
            </button>
          </div>
        </div>
      )}

      {/* Grid de Seleção de Produtos */}
      <Card className="lg:col-span-2 flex flex-col justify-between">
        <div>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Cardápio Lanchonete</CardTitle>
            <CardDescription>
              Selecione os produtos abaixo para montar a venda
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {/* Barra de Busca e Categorias */}
            <div className="flex flex-col gap-3">
              <Input
                placeholder="Buscar produto pelo nome..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="rounded-xl border-border bg-background"
              />

              {/* Abas das Categorias (Segmented Pills Control) */}
              <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-muted/50 p-1.5 border border-black/[0.03] shadow-inner shadow-black/5 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                    selectedCategory === "all"
                      ? "bg-primary border-primary text-white shadow-sm"
                      : "bg-background/80 hover:bg-muted/40 text-muted-foreground border-transparent hover:text-zinc-800"
                  }`}
                >
                  🍽️ Todos ({products.length})
                </button>
                {categoriesList.map((cat) => {
                  const count = products.filter((p) => p.category?.id === cat.id).length;
                  const emoji = getCategoryEmoji(cat.name);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                        selectedCategory === cat.id
                          ? "bg-primary border-primary text-white shadow-sm"
                          : "bg-background/80 hover:bg-muted/40 text-muted-foreground border-transparent hover:text-zinc-800"
                      }`}
                    >
                      <span>{emoji}</span>
                      <span>{cat.name}</span>
                      <span className="text-[10px] opacity-75 font-medium">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grid dos Cards de Produtos */}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 border border-dashed rounded-2xl text-center text-muted-foreground px-4">
                <span className="text-sm font-semibold">Nenhum produto cadastrado nesta categoria</span>
                <span className="text-xs text-muted-foreground/80 mt-1">
                  Cadastre produtos na aba Produtos ou ajuste o filtro.
                </span>
              </div>
            ) : (
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-h-[520px] overflow-y-auto pr-1">
                {filtered.map((p) => {
                  const qty = cart[p.id] ?? 0;
                  const emoji = p.category ? getCategoryEmoji(p.category.name) : "🍔";
                  return (
                    <div
                      key={p.id}
                      onClick={() => addToCart(p.id)}
                      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-4 cursor-pointer select-none transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                        qty > 0
                          ? "bg-primary/[0.04] border-primary/40 shadow-sm shadow-primary/5"
                          : "bg-background/85 border-black/[0.04] hover:bg-background hover:border-black/[0.09]"
                      }`}
                    >
                      {qty > 0 && (
                        <span className="absolute right-2.5 top-2.5 grid size-5 place-items-center rounded-full bg-primary text-[9px] font-bold text-white shadow-sm">
                          {qty}
                        </span>
                      )}
                      
                      <div>
                        <span className="text-xl mb-1.5 block group-hover:scale-110 transition-transform duration-300 pointer-events-none">{emoji}</span>
                        <h3 className="font-semibold text-xs leading-snug text-zinc-900 group-hover:text-primary transition-colors">
                          {p.name}
                        </h3>
                        <p className="text-[9px] text-muted-foreground mt-0.5 uppercase tracking-wide">
                          {p.category?.name ?? "Outros"}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-950">
                          {formatMoney(Number(p.price))}
                        </span>
                        
                        <span className={`text-[9px] font-bold rounded-lg px-2 py-0.5 transition-all ${
                          qty > 0
                            ? "bg-primary text-white shadow-xs"
                            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                        }`}>
                          {qty > 0 ? "Adicionado" : "+ Add"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </div>
      </Card>

      {/* Painel do Pedido e Pagamento */}
      <Card className="flex flex-col justify-between">
        <div>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Resumo do Pedido</CardTitle>
            <CardDescription>
              Dados da entrega, desconto e pagamentos
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {!cashOpen ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 font-medium">
                ⚠️ Atenção: O caixa está fechado! Abra o caixa na tela de Caixa antes de vender.
              </div>
            ) : null}

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-900 font-medium">
                {error}
              </div>
            ) : null}

            {/* Identificação do Pedido */}
            <div className="grid gap-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cliente / Identificação</Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ex: Henrique, Mesa 5, Viagem..."
                className="rounded-xl border-border bg-background h-9 text-xs"
              />
              <div className="flex flex-wrap gap-1">
                {["Balcão", "Mesa 1", "Mesa 2", "Mesa 3", "Viagem", "Delivery"].map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setCustomerName(name)}
                    className={`rounded-lg border px-2 py-0.5 text-[9px] font-semibold transition-all cursor-pointer ${
                      customerName === name
                        ? "bg-primary/10 border-primary/40 text-primary font-bold"
                        : "bg-background/40 hover:bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* Observações */}
            <div className="grid gap-1">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Observações do Pedido</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: sem cebola, maionese extra"
                className="rounded-xl border-border bg-background h-9 text-xs"
              />
            </div>

            {/* Desconto e Taxa de Entrega */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Desconto (R$)</Label>
                <Input
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  inputMode="decimal"
                  className="rounded-xl border-border bg-background h-9 text-xs"
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Entrega (R$)</Label>
                <Input
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                  inputMode="decimal"
                  className="rounded-xl border-border bg-background h-9 text-xs"
                />
              </div>
            </div>

            {/* Itens no Carrinho */}
            <div className="rounded-2xl border border-border bg-background/40 p-3.5">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Itens Selecionados</h4>
              {cartItems.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  Nenhum item selecionado ainda.
                </div>
              ) : (
                <div className="grid gap-2 max-h-[140px] overflow-y-auto pr-1">
                  {cartItems.map((i) => (
                    <div key={i.productId} className="flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold text-zinc-900">{i.name}</div>
                        <div className="text-[9px] text-muted-foreground">
                          {formatMoney(i.price)}/un
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setQty(i.productId, i.quantity - 1)}
                          className="grid size-6 place-items-center rounded-lg border border-border bg-background hover:bg-muted text-xs cursor-pointer"
                        >
                          -
                        </button>
                        <div className="w-5 text-center font-bold text-xs text-zinc-950">
                          {i.quantity}
                        </div>
                        <button
                          type="button"
                          onClick={() => setQty(i.productId, i.quantity + 1)}
                          className="grid size-6 place-items-center rounded-lg border border-border bg-background hover:bg-muted text-xs cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resumo Financeiro */}
            <div className="rounded-2xl border border-border bg-background/80 p-3 text-xs grid gap-1.5 shadow-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Desconto</span>
                <span>{formatMoney(discountN)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Taxa de Entrega</span>
                <span>{formatMoney(deliveryN)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-dashed pt-2 font-bold text-sm text-zinc-950 mt-1">
                <span>Total Geral</span>
                <span className="text-base text-primary tracking-tight">{formatMoney(total)}</span>
              </div>
            </div>

            {/* Configuração de Pagamento */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Métodos de Pagamento</h4>
                </div>
                <Button variant="outline" size="sm" onClick={addPaymentRow} className="h-7 text-[10px] px-2 rounded-lg cursor-pointer">
                  + Add Parcela
                </Button>
              </div>

              {/* Linhas de Pagamento */}
              <div className="grid gap-1.5 max-h-[120px] overflow-y-auto">
                {payments.map((p, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-1.5 items-center">
                    <div className="col-span-7">
                      <select
                        value={p.paymentMethodId}
                        onChange={(e) =>
                          setPayments((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, paymentMethodId: e.target.value } : x)),
                          )
                        }
                        className="h-8 w-full rounded-lg border border-input bg-background px-2 py-0 text-xs shadow-xs focus:ring-1 focus:ring-primary focus:outline-none"
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
                        placeholder="Valor"
                        className="h-8 rounded-lg text-xs"
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        type="button"
                        aria-label="Remover pagamento"
                        onClick={() => removePaymentRow(idx)}
                        disabled={payments.length === 1}
                        className="text-muted-foreground hover:text-red-600 disabled:opacity-30 text-base font-medium cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Validador da Soma de Pagamentos */}
              <div className="flex items-center justify-between rounded-xl border bg-background/50 px-3 py-2 text-xs">
                <span className="text-muted-foreground">Soma informada</span>
                <span className={`font-bold ${Math.abs(paymentSum - total) < 0.009 ? "text-emerald-700" : "text-red-600"}`}>
                  {formatMoney(paymentSum)}
                </span>
              </div>
            </div>

            {/* Fluxo de Dinheiro Recebido para Troco */}
            {hasCash ? (
              <div className="grid gap-2 border-t pt-3 border-dashed">
                <div className="grid gap-1">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Dinheiro Recebido (BRL)</Label>
                  <Input
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    inputMode="decimal"
                    placeholder="0,00"
                    className="rounded-xl border-border bg-background h-9 text-xs"
                  />
                </div>
                
                {cashReceivedN > 0 && (
                  <div className="flex items-center justify-between rounded-2xl bg-zinc-50 border border-zinc-100 px-4 py-2 text-xs mt-0.5">
                    <div>
                      <div className="text-[10px] text-muted-foreground font-semibold">Troco devido</div>
                      <div className="text-base font-bold text-zinc-950">{formatMoney(changeDue)}</div>
                    </div>
                    <div className="text-right text-[10px] text-muted-foreground">
                      Recebido: <span className="font-semibold text-zinc-900">{formatMoney(cashReceivedN)}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </div>

        <div className="p-4 border-t bg-zinc-50/50 rounded-b-2xl">
          {step === "editing" ? (
            <Button
              className="w-full rounded-2xl py-5 text-xs font-bold text-white shadow-md hover:bg-primary/95 cursor-pointer"
              onClick={goConfirm}
              disabled={isPending || cartItems.length === 0}
            >
              Confirmar Pedido
            </Button>
          ) : (
            <div className="grid gap-2">
              <div className="rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-xs text-primary font-medium">
                Deseja salvar a venda no valor de <span className="font-bold">{formatMoney(total)}</span>?
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl text-xs font-bold cursor-pointer"
                  onClick={() => setStep("editing")}
                  disabled={isPending}
                >
                  Voltar
                </Button>
                <Button
                  className="rounded-xl text-xs font-bold cursor-pointer"
                  onClick={finalize}
                  disabled={isPending}
                >
                  {isPending ? "Processando..." : "Finalizar (F5)"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

