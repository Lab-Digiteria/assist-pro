import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Package, TrendingUp, Wrench } from "lucide-react";
import { OS_STATUS_LABELS, FORMA_PAGAMENTO_LABELS } from "../../../shared/utils";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default function Dashboard() {
  const { data, isLoading } = trpc.financeiro.dashboard.useQuery();

  if (isLoading) {
    return (
      <AppLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  const alertas = data?.alertas;
  const totalAlertas =
    (alertas?.osVencidas.length ?? 0) +
    (alertas?.osAguardandoRetirada.length ?? 0) +
    (alertas?.pecasAbaixoMinimo.length ?? 0);

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {/* Alertas Críticos */}
        {totalAlertas > 0 && (
          <div className="rounded-xl border-2 border-destructive/30 bg-destructive/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <h2 className="font-semibold text-destructive">Alertas Críticos ({totalAlertas})</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {/* OS Vencidas */}
              {(alertas?.osVencidas.length ?? 0) > 0 && (
                <div className="bg-white rounded-lg p-3 border border-destructive/20">
                  <p className="text-xs font-semibold text-destructive mb-2">
                    OS com prazo vencido ({alertas?.osVencidas.length})
                  </p>
                  {alertas?.osVencidas.slice(0, 3).map((os) => (
                    <div key={os.id} className="flex justify-between text-xs py-1 border-b last:border-0">
                      <span className="font-medium">{os.numero}</span>
                      <span className="text-destructive">{os.diasAtraso}d atraso</span>
                    </div>
                  ))}
                </div>
              )}
              {/* Aguardando Retirada */}
              {(alertas?.osAguardandoRetirada.length ?? 0) > 0 && (
                <div className="bg-white rounded-lg p-3 border border-yellow-200">
                  <p className="text-xs font-semibold text-yellow-700 mb-2">
                    Aguardando retirada ({alertas?.osAguardandoRetirada.length})
                  </p>
                  {alertas?.osAguardandoRetirada.slice(0, 3).map((os) => (
                    <div key={os.id} className="flex justify-between text-xs py-1 border-b last:border-0">
                      <span className="font-medium">{os.numero}</span>
                      <span className="text-yellow-700">{os.diasEsperando}d esperando</span>
                    </div>
                  ))}
                </div>
              )}
              {/* Peças abaixo do mínimo */}
              {(alertas?.pecasAbaixoMinimo.length ?? 0) > 0 && (
                <div className="bg-white rounded-lg p-3 border border-orange-200">
                  <p className="text-xs font-semibold text-orange-700 mb-2">
                    Peças abaixo do mínimo ({alertas?.pecasAbaixoMinimo.length})
                  </p>
                  {alertas?.pecasAbaixoMinimo.slice(0, 3).map((p) => (
                    <div key={p.id} className="flex justify-between text-xs py-1 border-b last:border-0">
                      <span className="font-medium truncate">{p.nome}</span>
                      <span className="text-orange-700">{p.quantidadeAtual}/{p.quantidadeMinima}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* OS por Status */}
        <div>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Wrench className="w-4 h-4" /> Ordens de Serviço por Status
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Object.entries(data?.osPorStatus ?? {}).map(([status, count]) => (
              <Card key={status} className="text-center">
                <CardContent className="pt-4 pb-3">
                  <div className="text-2xl font-bold text-primary">{count}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {OS_STATUS_LABELS[status] ?? status}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Financeiro */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Hoje</span>
                <span className="font-bold text-lg text-primary">
                  {formatCurrency(data?.financeiro.faturamentoHoje ?? 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Este mês</span>
                <span className="font-bold text-lg text-primary">
                  {formatCurrency(data?.financeiro.faturamentoMes ?? 0)}
                </span>
              </div>
              <div className="border-t pt-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground mb-2">Por forma de pagamento</p>
                {Object.entries(data?.financeiro.breakdownPagamento ?? {}).map(([forma, valor]) => (
                  <div key={forma} className="flex justify-between text-xs">
                    <span>{FORMA_PAGAMENTO_LABELS[forma] ?? forma}</span>
                    <span className="font-medium">{formatCurrency(valor)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" /> Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">OS em aberto</span>
                <span className="font-bold text-2xl text-primary">
                  {data?.performance.totalOsAbertas ?? 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
