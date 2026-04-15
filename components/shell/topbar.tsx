"use client";

import { signOut, useSession } from "next-auth/react";
import { Search, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";

function Topbar({ title }: { title: string }) {
  const { data } = useSession();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-8">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold tracking-tight text-foreground md:text-xl">
          {title}
        </h1>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden w-[360px] max-w-[38vw] md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar…"
            className="h-10 rounded-full border-transparent bg-muted/60 pl-10 shadow-inner shadow-black/5 ring-1 ring-black/5 focus-visible:bg-background"
            aria-label="Buscar"
          />
        </div>

        <div className="flex items-center gap-2 rounded-2xl border bg-card p-1 pl-1.5 shadow-sm">
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
