"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { CancelSale } from "@/features/sales/components/cancel-sale";

export function SaleRowActions({ saleId }: { saleId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <ButtonLink variant="outline" size="sm" href={`/vendas/${saleId}/comprovante?format=80mm`}>
          80mm
        </ButtonLink>
        <ButtonLink variant="outline" size="sm" href={`/vendas/${saleId}/comprovante?format=a4`}>
          A4
        </ButtonLink>
      </div>

      <Button
        variant={open ? "outline" : "destructive"}
        size="sm"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Fechar" : "Cancelar"}
      </Button>

      {open ? (
        <div className="w-[320px] max-w-[75vw] rounded-2xl border bg-background/80 p-3 shadow-sm">
          <CancelSale saleId={saleId} />
        </div>
      ) : null}
    </div>
  );
}
