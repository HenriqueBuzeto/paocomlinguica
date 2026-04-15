"use client";

import { useActionState } from "react";

import { closeCashRegisterAction } from "@/app/caixa/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CloseCashRegisterForm() {
  const [error, action, isPending] = useActionState(
    async (_: string | null, formData: FormData) => {
      try {
        await closeCashRegisterAction(formData);
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Erro ao fechar caixa.";
      }
    },
    null,
  );

  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="closingBalanceReported">Valor contado (R$)</Label>
        <Input
          id="closingBalanceReported"
          name="closingBalanceReported"
          inputMode="decimal"
          placeholder="Ex: 350,00"
          required
        />
        <p className="text-xs text-muted-foreground">
          O sistema calcula o esperado e registra a diferença.
        </p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Fechando..." : "Fechar caixa"}
      </Button>
    </form>
  );
}
