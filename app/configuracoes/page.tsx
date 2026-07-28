import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDb } from "@/lib/db";
import {
  togglePaymentMethodActiveAction,
  createPaymentMethodAction,
  createUserAction,
} from "./actions";
import { Shield, Key, Coins, CreditCard, User, UserPlus } from "lucide-react";

export default async function ConfiguracoesPage() {
  const db = getDb();
  
  const [paymentMethods, users] = await Promise.all([
    db.paymentMethod.findMany({
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      orderBy: { name: "asc" },
      include: {
        roles: {
          include: { role: true }
        }
      },
    }),
  ]);

  return (
    <AppShell title="Configurações">
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm text-muted-foreground">
            Gerenciamento de operadores do sistema e métodos de recebimento da lanchonete
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Coluna 1: Métodos de Pagamento */}
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Métodos de Pagamento</CardTitle>
                <CardDescription>
                  Ative, desative ou cadastre novos meios de pagamento aceitos no PDV
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                {/* Lista de Métodos de Pagamento */}
                <div className="overflow-hidden rounded-2xl border bg-background/60">
                  <div className="grid grid-cols-12 gap-3 border-b bg-muted/40 px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <div className="col-span-6">Nome / Tipo</div>
                    <div className="col-span-3 text-center">Status</div>
                    <div className="col-span-3 text-right">Ação</div>
                  </div>

                  <div className="divide-y">
                    {paymentMethods.map((pm) => (
                      <div
                        key={pm.id}
                        className="grid grid-cols-12 items-center gap-3 px-4 py-3 text-xs hover:bg-muted/10 transition-colors"
                      >
                        <div className="col-span-6 min-w-0">
                          <div className="font-bold text-zinc-950 truncate uppercase">
                            {pm.name.replace(/_/g, " ")}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {pm.kind === "CASH" ? "Dinheiro" : pm.kind === "PIX" ? "PIX" : pm.kind === "CARD" ? "Cartão" : "Outros"}
                          </div>
                        </div>

                        <div className="col-span-3 text-center">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold ${
                              pm.active
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : "bg-zinc-50 text-zinc-500 border-zinc-200"
                            }`}
                          >
                            {pm.active ? "Ativo" : "Inativo"}
                          </span>
                        </div>

                        <div className="col-span-3 flex justify-end">
                          <form action={togglePaymentMethodActiveAction}>
                            <input type="hidden" name="id" value={pm.id} />
                            <Button
                              variant="outline"
                              size="sm"
                              type="submit"
                              className="h-7 text-[10px] rounded-lg cursor-pointer hover:bg-muted/30"
                            >
                              {pm.active ? "Desativar" : "Ativar"}
                            </Button>
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Formulário Novo Método */}
                <div className="mt-2 rounded-2xl border bg-muted/20 p-4">
                  <h4 className="text-xs font-bold text-zinc-950 mb-3 flex items-center gap-1.5">
                    <CreditCard className="size-4 text-primary" /> Novo Método de Pagamento
                  </h4>
                  <form action={createPaymentMethodAction} className="grid gap-3">
                    <div className="grid gap-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">Nome do Método</Label>
                      <Input
                        name="name"
                        required
                        placeholder="Ex: IFOOD PAY, TICKET REFEICAO"
                        className="h-8 rounded-lg bg-background text-xs"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">Tipo (Kind)</Label>
                      <select
                        name="kind"
                        className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs shadow-xs focus:outline-none"
                      >
                        <option value="CARD">Cartão (Card)</option>
                        <option value="PIX">PIX</option>
                        <option value="CASH">Dinheiro (Cash)</option>
                        <option value="OTHER">Outros (Other)</option>
                      </select>
                    </div>
                    <Button type="submit" size="sm" className="h-8 rounded-lg text-xs font-bold cursor-pointer">
                      Adicionar Método
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna 2: Usuários e Operadores */}
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Equipe e Operadores</CardTitle>
                <CardDescription>
                  Visualize a equipe e cadastre novos operadores ou administradores do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                {/* Lista de Operadores */}
                <div className="overflow-hidden rounded-2xl border bg-background/60">
                  <div className="grid grid-cols-12 gap-3 border-b bg-muted/40 px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <div className="col-span-8">Nome / E-mail</div>
                    <div className="col-span-4 text-right">Função (Role)</div>
                  </div>

                  <div className="divide-y">
                    {users.map((u) => (
                      <div
                        key={u.id}
                        className="grid grid-cols-12 items-center gap-3 px-4 py-3 text-xs hover:bg-muted/10 transition-colors"
                      >
                        <div className="col-span-8 min-w-0">
                          <div className="font-bold text-zinc-950 truncate">
                            {u.name ?? "Sem nome"}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                            {u.email}
                          </div>
                        </div>

                        <div className="col-span-4 flex justify-end">
                          <span
                            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[9px] font-bold border ${
                              (u.roles[0]?.role?.name ?? "OPERADOR") === "ADMIN"
                                ? "bg-red-50 text-red-700 border-red-100"
                                : (u.roles[0]?.role?.name ?? "OPERADOR") === "GERENTE"
                                ? "bg-amber-50 text-amber-700 border-amber-100"
                                : "bg-blue-50 text-blue-700 border-blue-100"
                            }`}
                          >
                            <Shield className="size-3" />
                            {u.roles[0]?.role?.name ?? "OPERADOR"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Formulário Novo Usuário */}
                <div className="mt-2 rounded-2xl border bg-muted/20 p-4">
                  <h4 className="text-xs font-bold text-zinc-950 mb-3 flex items-center gap-1.5">
                    <UserPlus className="size-4 text-primary" /> Novo Operador / Usuário
                  </h4>
                  <form action={createUserAction} className="grid gap-3">
                    <div className="grid gap-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">Nome do Funcionário</Label>
                      <Input
                        name="name"
                        required
                        placeholder="Ex: Carlos Silva"
                        className="h-8 rounded-lg bg-background text-xs"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">E-mail (Login)</Label>
                      <Input
                        name="email"
                        type="email"
                        required
                        placeholder="Ex: carlos@gmail.com"
                        className="h-8 rounded-lg bg-background text-xs"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">Senha de Acesso</Label>
                      <Input
                        name="password"
                        type="password"
                        required
                        placeholder="Digite uma senha forte"
                        className="h-8 rounded-lg bg-background text-xs"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase">Função (Cargo)</Label>
                      <select
                        name="roleName"
                        className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs shadow-xs focus:outline-none"
                      >
                        <option value="OPERADOR">OPERADOR (Acesso PDV/Caixa)</option>
                        <option value="GERENTE">GERENTE (Edição de estoque/Relatórios)</option>
                        <option value="ADMIN">ADMINISTRADOR (Acesso Total)</option>
                      </select>
                    </div>
                    <Button type="submit" size="sm" className="h-8 rounded-lg text-xs font-bold cursor-pointer">
                      Registrar Operador
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

