import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";
import { CloseCashRegisterForm } from "@/features/cash/components/close-cash-register-form";

export default function FecharCaixaPage() {
  return (
    <AppShell title="Fechar caixa">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Confira o caixa, informe o valor contado e finalize o turno.
            </p>
          </div>
          <ButtonLink variant="outline" href="/caixa">Voltar</ButtonLink>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conferência</CardTitle>
            <CardDescription>
              O sistema calcula o saldo esperado e registra a diferença.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CloseCashRegisterForm />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
