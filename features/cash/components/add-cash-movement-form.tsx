"use client";

import { useActionState, useMemo } from "react";

import { addCashMovementAction } from "@/app/caixa/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const allowedTypes = ["SUPRIMENTO", "SANGRIA", "DESPESA"] as const;

export function AddCashMovementForm({ defaultType }: { defaultType?: string }) {
  const initial = useMemo(() => {
    const safe = (defaultType ?? "").toUpperCase();
    return (allowedTypes as readonly string[]).includes(safe) ? safe : "SUPRIMENTO";
  }, [defaultType]);

  const [error, action, isPending] = useActionState(
    async (_: string | null, formData: FormData) => {
      try {
        await addCashMovementAction(formData);
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Erro ao registrar movimentação.";
      }
    },
    null,
  );

  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="type">Tipo</Label>
        <select
          id="type"
          name="type"
          defaultValue={initial}
          className="h-10 w-full rounded-xl border border-input bg-background/60 px-3 text-sm shadow-sm shadow-black/5 outline-none focus-visible:ring-3 focus-visible:ring-ring/35"
        >
          <option value="SUPRIMENTO">Suprimento</option>
          <option value="SANGRIA">Sangria</option>
          <option value="DESPESA">Despesa</option>
        </select>
        <p className="text-xs text-muted-foreground">
          Sangria é sempre retirada de dinheiro.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="amount">Valor (R$)</Label>
        <Input
          id="amount"
          name="amount"
          inputMode="decimal"
          placeholder="Ex: 50,00"
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Descrição (opcional)</Label>
        <Input
          id="description"
          name="description"
          placeholder="Ex: Troco, gás, compra rápida..."
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Salvando..." : "Salvar movimentação"}
      </Button>
    </form>
  );
}
