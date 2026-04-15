import { AppShell } from "@/components/shell/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";
import { OpenCashRegisterForm } from "@/features/cash/components/open-cash-register-form";

export default function AbrirCaixaPage() {
  return (
    <AppShell title="Abrir caixa">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Informe o saldo inicial para iniciar um novo turno.
            </p>
          </div>
          <ButtonLink variant="outline" href="/caixa">Voltar</ButtonLink>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Saldo inicial</CardTitle>
            <CardDescription>
              Obrigatório. Será registrado automaticamente como SUPRIMENTO.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OpenCashRegisterForm />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
