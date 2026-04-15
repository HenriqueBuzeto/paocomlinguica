"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CancelSale } from "@/features/sales/components/cancel-sale";

export function SaleRowActions({ saleId }: { saleId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-end gap-2">
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
