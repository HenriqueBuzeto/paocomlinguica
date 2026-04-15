"use client";

import { useEffect, useMemo, useState } from "react";

function formatBrasilia(now: Date) {
  const date = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(now);

  const time = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(now);

  return { date, time };
}

function BrasiliaClock({ className }: { className?: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const value = useMemo(() => formatBrasilia(now), [now]);

  return (
    <div className={className}>
      <div className="text-xs font-medium text-muted-foreground">Brasília</div>
      <div className="mt-0.5 flex items-baseline gap-2">
        <div className="text-sm font-semibold tracking-tight text-foreground">
          {value.time}
        </div>
        <div className="hidden text-xs text-muted-foreground md:block">
          {value.date}
        </div>
      </div>
    </div>
  );
}

export { BrasiliaClock };
