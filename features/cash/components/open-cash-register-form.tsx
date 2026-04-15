"use client";

import { useActionState } from "react";

import { openCashRegisterAction } from "@/app/caixa/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OpenCashRegisterForm() {
  const [error, action, isPending] = useActionState(
    async (_: string | null, formData: FormData) => {
      try {
        await openCashRegisterAction(formData);
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Erro ao abrir caixa.";
      }
    },
    null,
  );

  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="openingBalance">Saldo inicial (R$)</Label>
        <Input
          id="openingBalance"
          name="openingBalance"
          inputMode="decimal"
          placeholder="Ex: 100,00"
          required
        />
        <p className="text-xs text-muted-foreground">
          Use vírgula ou ponto. Ex.: 100,00
        </p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Abrindo..." : "Abrir caixa"}
      </Button>
    </form>
  );
}
