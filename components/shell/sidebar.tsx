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
  { label: "Caixa", href: "/caixa", icon: Wallet },
  { label: "Vendas", href: "/vendas", icon: Receipt },
  { label: "Produtos", href: "/produtos", icon: Package },
  { label: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { label: "Configurações", href: "/configuracoes", icon: Settings },
] as const;

function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[288px] flex-col border-r border-white/10 bg-[#0b0b0c] text-sidebar-foreground md:flex">
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="grid size-10 place-items-center rounded-2xl bg-white/6 text-sidebar-foreground ring-1 ring-white/10 shadow-sm">
          <span className="text-sm font-semibold tracking-tight">PL</span>
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold tracking-tight text-white">
            Pão com Linguiça
          </div>
          <div className="truncate text-xs text-white/60">Operação</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5 px-3 py-4">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          const base =
            "group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm transition-colors";

          const cls = cn(
            base,
            active
              ? "bg-white/8 text-white"
              : "text-white/70 hover:bg-white/7 hover:text-white",
          );

          const content = (
            <>
              <span
                className={cn(
                  "relative grid size-9 place-items-center rounded-xl border border-white/10 bg-white/5 transition-colors",
                  active &&
                    "border-primary/35 bg-primary/12 shadow-[0_10px_30px_-18px] shadow-primary/60",
                )}
              >
                {active ? (
                  <span className="absolute left-[-12px] top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_22px_rgba(249,115,22,0.30)]" />
                ) : null}
                <Icon className={cn("size-4", active ? "text-primary" : "text-white/80")} />
              </span>
              <span className="truncate">{item.label}</span>
            </>
          );

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
