"use client";

import { useActionState } from "react";

import { cancelSaleAction } from "@/features/sales/cancel-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CancelSale({ saleId }: { saleId: string }) {
  const [error, action, pending] = useActionState(
    async (_: string | null, formData: FormData) => {
      try {
        await cancelSaleAction(formData);
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Erro ao cancelar venda.";
      }
    },
    null,
  );

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="id" value={saleId} />
      <div className="grid gap-2">
        <Label htmlFor="reason">Motivo (opcional)</Label>
        <Input id="reason" name="reason" placeholder="Ex: cliente desistiu" />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" variant="destructive" disabled={pending}>
        {pending ? "Cancelando..." : "Cancelar venda"}
      </Button>
    </form>
  );
}
