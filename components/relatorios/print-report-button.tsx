"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintReportButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.print()}
      className="gap-2 no-print rounded-xl cursor-pointer"
    >
      <Printer className="size-4" /> Imprimir Relatório
    </Button>
  );
}
