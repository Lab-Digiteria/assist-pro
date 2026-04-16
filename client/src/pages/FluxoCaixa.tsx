import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ArrowDownCircle, ArrowUpCircle, TrendingUp } from "lucide-react";

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}
function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

function getDefaultRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { from, to };
}

export default function FluxoCaixa() {
  const [range, setRange] = useState(getDefaultRange);
  const [bankAccountId, setBankAccountId] = useState<string>("all");

  const { data: accounts = [] } = trpc.financeiroV2.bankAccounts.list.useQuery();
  const { data, isLoading } = trpc.financeiroV2.cashFlow.useQuery({
    from: range.from,
    to: range.to,
    bankAccountId: bankAccountId !== "all" ? parseInt(bankAccountId) : undefined,
  });

  const chartData = (data?.entries ?? []).map((e, idx) => ({
    name: fmtDate(e.date),
    Saldo: e.runningBalance,
    idx,
  }));

  return (
    <AppLayout title="Fluxo de Caixa">
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Fluxo de Caixa</h1>
            <p className="text-muted-foreground text-sm">Entradas e saídas no período selecionado</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-3 flex-wrap items-end">
          <div>
            <Label className="text-xs">De</Label>
            <Input type="date" value={range.from} onChange={e => setRange(r => ({ ...r, from: e.target.value }))} className="w-36" />
          </div>
          <div>
            <Label className="text-xs">Até</Label>
            <Input type="date" value={range.to} onChange={e => setRange(r => ({ ...r, to: e.target.value }))} className="w-36" />
          </div>
          <div>
            <Label className="text-xs">Conta</Label>
            <Select value={bankAccountId} onValueChange={setBankAccountId}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as contas</SelectItem>
                {accounts.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {/* Atalhos de período */}
          <div className="flex gap-2">
            {[
              { label: "Este mês", fn: () => { const n = new Date(); setRange({ from: new Date(n.getFullYear(), n.getMonth(), 1).toISOString().slice(0, 10), to: new Date(n.getFullYear(), n.getMonth() + 1, 0).toISOString().slice(0, 10) }); } },
              { label: "Mês ant.", fn: () => { const n = new Date(); setRange({ from: new Date(n.getFullYear(), n.getMonth() - 1, 1).toISOString().slice(0, 10), to: new Date(n.getFullYear(), n.getMonth(), 0).toISOString().slice(0, 10) }); } },
              { label: "3 meses", fn: () => { const n = new Date(); setRange({ from: new Date(n.getFullYear(), n.getMonth() - 2, 1).toISOString().slice(0, 10), to: new Date(n.getFullYear(), n.getMonth() + 1, 0).toISOString().slice(0, 10) }); } },
            ].map(b => (
              <Button key={b.label} variant="outline" size="sm" onClick={b.fn}>{b.label}</Button>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <ArrowDownCircle className="h-4 w-4" />
                <p className="text-sm font-medium">Total Entradas</p>
              </div>
              <p className="text-2xl font-bold text-green-600">{fmt(data?.totalIn ?? 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-600 mb-1">
                <ArrowUpCircle className="h-4 w-4" />
                <p className="text-sm font-medium">Total Saídas</p>
              </div>
              <p className="text-2xl font-bold text-red-600">{fmt(data?.totalOut ?? 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4" />
                <p className="text-sm font-medium">Resultado</p>
              </div>
              <p className={`text-2xl font-bold ${(data?.balance ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                {fmt(data?.balance ?? 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evolução do Saldo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Area type="monotone" dataKey="Saldo" stroke="#3b82f6" fill="url(#colorSaldo)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Tabela */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (data?.entries?.length ?? 0) === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 gap-2">
              <TrendingUp className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhum lançamento no período</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Data</th>
                      <th className="text-left p-3 font-medium">Descrição</th>
                      <th className="text-center p-3 font-medium">Tipo</th>
                      <th className="text-right p-3 font-medium">Valor</th>
                      <th className="text-right p-3 font-medium">Saldo Acumulado</th>
                      <th className="text-center p-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.entries ?? []).map((entry, idx) => (
                      <tr key={idx} className={`border-b hover:bg-muted/30 transition-colors ${entry.isProjected ? "opacity-60" : ""}`}>
                        <td className="p-3 text-muted-foreground">{fmtDate(entry.date)}</td>
                        <td className="p-3">{entry.description}</td>
                        <td className="p-3 text-center">
                          {entry.type === "in" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                              <ArrowDownCircle className="h-3 w-3" /> Entrada
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">
                              <ArrowUpCircle className="h-3 w-3" /> Saída
                            </span>
                          )}
                        </td>
                        <td className={`p-3 text-right font-semibold ${entry.type === "in" ? "text-green-700" : "text-red-700"}`}>
                          {entry.type === "in" ? "+" : "-"}{fmt(entry.amount)}
                        </td>
                        <td className={`p-3 text-right font-bold ${entry.runningBalance >= 0 ? "text-green-700" : "text-red-700"}`}>
                          {fmt(entry.runningBalance)}
                        </td>
                        <td className="p-3 text-center">
                          {entry.isProjected ? (
                            <span className="text-xs text-muted-foreground italic">Projetado</span>
                          ) : (
                            <span className="text-xs text-green-600 font-medium">Realizado</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
