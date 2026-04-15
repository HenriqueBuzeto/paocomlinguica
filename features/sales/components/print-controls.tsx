"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

export function PrintControls() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const format = searchParams.get("format") ?? "80mm";

  function setFormat(next: "80mm" | "a4") {
    const params = new URLSearchParams(searchParams.toString());
    params.set("format", next);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="no-print flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Button
          variant={format === "80mm" ? "default" : "outline"}
          size="sm"
          onClick={() => setFormat("80mm")}
        >
          80mm
        </Button>
        <Button
          variant={format === "a4" ? "default" : "outline"}
          size="sm"
          onClick={() => setFormat("a4")}
        >
          A4
        </Button>
      </div>

      <Button size="sm" onClick={() => window.print()}>
        Imprimir
      </Button>
    </div>
  );
}
