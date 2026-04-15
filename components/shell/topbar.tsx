"use client";

import { signOut, useSession } from "next-auth/react";
import { Search, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";

function Topbar({ title }: { title: string }) {
  const { data } = useSession();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold tracking-tight text-foreground md:text-lg">
          {title}
        </h1>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden w-[360px] max-w-[38vw] md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar…"
            className="pl-9 shadow-inner"
            aria-label="Buscar"
          />
        </div>

        <div className="flex items-center gap-2 rounded-2xl border bg-card px-2 py-1 shadow-sm">
          <Avatar
            name={data?.user?.name ?? data?.user?.email ?? undefined}
            src={null}
          />
          <div className="hidden min-w-0 pr-1 md:block">
            <div className="truncate text-sm font-medium leading-5">
              {data?.user?.name ?? "Usuário"}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {data?.user?.email ?? ""}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sair"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

export { Topbar };
