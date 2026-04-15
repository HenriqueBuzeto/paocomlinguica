"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Home,
  Package,
  Receipt,
  Settings,
  Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";

const nav = [
  { label: "Dashboard", href: "/", icon: Home },
  { label: "Caixa", href: undefined, icon: Wallet },
  { label: "Vendas", href: undefined, icon: Receipt },
  { label: "Produtos", href: undefined, icon: Package },
  { label: "Relatórios", href: undefined, icon: BarChart3 },
  { label: "Configurações", href: undefined, icon: Settings },
] as const;

function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[280px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="grid size-9 place-items-center rounded-xl bg-sidebar-accent text-sidebar-foreground ring-1 ring-white/10">
          <span className="text-sm font-semibold tracking-tight">PL</span>
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold tracking-tight">
            Pão com Linguiça
          </div>
          <div className="truncate text-xs text-white/60">Operação</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2 py-3">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = item.href ? pathname === item.href : false;
          const disabled = !item.href;

          const base =
            "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors";

          const cls = cn(
            base,
            active
              ? "bg-white/8 text-white"
              : "text-white/75 hover:bg-white/6 hover:text-white",
            disabled && "cursor-not-allowed opacity-60 hover:bg-transparent",
          );

          const content = (
            <>
              <span
                className={cn(
                  "relative grid size-9 place-items-center rounded-xl border border-white/10 bg-white/5 transition-colors",
                  active &&
                    "border-primary/30 bg-primary/12 shadow-sm shadow-primary/20",
                )}
              >
                {active ? (
                  <span className="absolute left-[-12px] top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_0_3px_rgba(0,0,0,0.35)]" />
                ) : null}
                <Icon className={cn("size-4", active ? "text-primary" : "text-white/80")} />
              </span>
              <span className="truncate">{item.label}</span>
              {disabled ? (
                <span className="ml-auto rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/60">
                  em breve
                </span>
              ) : null}
            </>
          );

          if (!item.href) {
            return (
              <div key={item.label} className={cls} aria-disabled="true">
                {content}
              </div>
            );
          }

          return (
            <Link key={item.label} href={item.href} className={cls}>
              {content}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
          <div className="text-xs text-white/60">Atalhos</div>
          <div className="mt-1 text-sm font-medium text-white">Ctrl + K</div>
        </div>
      </div>
    </aside>
  );
}

export { Sidebar };
