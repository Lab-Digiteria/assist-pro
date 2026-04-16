import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  BarChart3,
  Building2,
  BookOpen,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

function fmt(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-");
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return months[parseInt(m) - 1] + "/" + y.slice(2);
}

export default function Financeiro() {
  const { data, isLoading } = trpc.financeiroV2.dashboardFinanceiro.useQuery();

  const ACCOUNT_TYPE_LABELS: Record<string, string> = {
    checking: "Conta Corrente",
    savings: "Poupança",
    cash: "Caixa",
    digital: "Conta Digital",
  };

  if (isLoading) {
    return (
      <AppLayout title="Financeiro">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  const chartData = (data?.sixMonthsData ?? []).map(d => ({
    name: monthLabel(d.month),
    Receitas: d.revenue,
    Despesas: d.expenses,
    Resultado: d.revenue - d.expenses,
  }));

  return (
    <AppLayout title="Financeiro">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Financeiro</h1>
            <p className="text-muted-foreground text-sm">Visão geral das finanças da sua empresa</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/financeiro/contas-bancarias">
                <Building2 className="h-4 w-4 mr-2" />
                Contas Bancárias
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/financeiro/plano-contas">
                <BookOpen className="h-4 w-4 mr-2" />
                Plano de Contas
              </Link>
            </Button>
          </div>
        </div>

        {/* Alertas */}
        {((data?.overdueReceivables ?? 0) > 0 || (data?.overduePayables ?? 0) > 0) && (
          <div className="flex gap-3">
            {(data?.overdueReceivables ?? 0) > 0 && (
              <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-sm text-yellow-800">
                <AlertTriangle className="h-4 w-4" />
                {data!.overdueReceivables} recebimento(s) em atraso
              </div>
            )}
            {(data?.overduePayables ?? 0) > 0 && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-800">
                <AlertTriangle className="h-4 w-4" />
                {data!.overduePayables} pagamento(s) em atraso
              </div>
            )}
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wallet className="h-4 w-4" /> Saldo Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${(data?.totalBalance ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                {fmt(data?.totalBalance ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">em todas as contas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" /> A Receber (30d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{fmt(data?.toReceive30 ?? 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">próximos 30 dias</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" /> A Pagar (30d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{fmt(data?.toPay30 ?? 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">próximos 30 dias</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Resultado do Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${(data?.monthResult ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                {fmt(data?.monthResult ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {fmt(data?.monthRevenue ?? 0)} rec. · {fmt(data?.monthExpenses ?? 0)} desp.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contas Bancárias */}
        {(data?.accounts?.length ?? 0) > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contas Bancárias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {data!.accounts.map(acc => (
                  <div key={acc.id} className="border rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">{ACCOUNT_TYPE_LABELS[acc.type] ?? acc.type}</p>
                    <p className="font-medium text-sm truncate">{acc.name}</p>
                    <p className={`text-lg font-bold mt-1 ${acc.currentBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {fmt(acc.currentBalance)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gráfico 6 meses */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Receitas vs Despesas — Últimos 6 Meses</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Bar dataKey="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Atalhos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: "/financeiro/contas-receber", label: "Contas a Receber", icon: ArrowDownCircle, color: "text-green-600" },
            { href: "/financeiro/contas-pagar", label: "Contas a Pagar", icon: ArrowUpCircle, color: "text-red-600" },
            { href: "/financeiro/fluxo-caixa", label: "Fluxo de Caixa", icon: BarChart3, color: "text-blue-600" },
            { href: "/financeiro/dre", label: "DRE", icon: TrendingUp, color: "text-purple-600" },
          ].map(item => (
            <Link key={item.href} href={item.href}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-3 p-4">
                  <item.icon className={`h-8 w-8 ${item.color}`} />
                  <span className="font-medium text-sm">{item.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
