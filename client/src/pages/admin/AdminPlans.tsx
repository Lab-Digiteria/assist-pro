/**
 * Control Plane — Planos
 * Rota: /admin/plans
 */
import { CoreLayout } from "@/components/CoreLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Clock, CheckCircle2 } from "lucide-react";

function fmt(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export default function AdminPlans() {
  const plansQuery = trpc.tenants.adminListPlans.useQuery();

  return (
    <CoreLayout title="Planos">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plansQuery.isLoading ? (
            <p style={{ color: "#64748b" }}>Carregando…</p>
          ) : (plansQuery.data ?? []).map((plan: any) => (
            <Card key={plan.id} style={{ background: "#161b27", borderColor: "#1e2535" }}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-white">{plan.name}</CardTitle>
                  <Badge variant="outline" style={{ color: "#22c55e", borderColor: "#22c55e40", background: "#22c55e15" }}>
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Ativo
                  </Badge>
                </div>
                {plan.description && (
                  <p className="text-xs mt-1" style={{ color: "#64748b" }}>{plan.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-white">{fmt(plan.priceMonthly)}</span>
                  <span className="text-xs" style={{ color: "#64748b" }}>/mês</span>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: "#64748b" }}>
                  <Clock className="w-3.5 h-3.5" style={{ color: "#22c55e" }} />
                  Trial de {plan.trialDays} dias
                </div>
                <div className="flex items-center justify-between text-xs border-t pt-3 mt-3" style={{ borderColor: "#1e2535", color: "#64748b" }}>
                  <span className="font-mono">{plan.id.slice(0, 8)}…</span>
                  <span style={{ color: "#1B4F8A" }}>{plan.slug}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card style={{ background: "#161b27", borderColor: "#1e2535" }}>
          <CardHeader>
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <Package className="w-4 h-4" style={{ color: "#1B4F8A" }} />
              Informações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs" style={{ color: "#64748b" }}>
              Os planos são gerenciados via seed no banco de dados. Para alterar preços ou criar novos planos,
              execute o endpoint <code className="font-mono text-white">subscriptions.seedPlans</code> após
              atualizar o arquivo <code className="font-mono text-white">server/routers/subscriptions.ts</code>.
            </p>
          </CardContent>
        </Card>
      </div>
    </CoreLayout>
  );
}
