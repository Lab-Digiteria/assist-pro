import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
} from "recharts";
import { Download, BarChart3, TrendingUp, Users, Trophy } from "lucide-react";
import { OS_STATUS_LABELS, FORMA_PAGAMENTO_LABELS } from "../../../shared/utils";
import { toast } from "sonner";

const COLORS = ["#1B4F8A", "#C4733A", "#E8C547", "#6B7280", "#10b981", "#f59e0b"];

function exportCSV(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) { toast.error("Sem dados para exportar"); return; }
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  toast.success("CSV exportado!");
}

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Relatorios() {
  const { data } = trpc.financeiro.dashboard.useQuery();
  const { data: os = [] } = trpc.os.list.useQuery({});
  const { data: faturamentoMensal = [] } = trpc.financeiro.faturamentoMensal.useQuery();
  const { data: rankingTecnicos = [] } = trpc.financeiro.rankingTecnicos.useQuery();

  const osPorStatusData = Object.entries(data?.osPorStatus ?? {}).map(([status, count]) => ({
    name: OS_STATUS_LABELS[status] ?? status,
    value: count,
  }));

  const pagamentoData = Object.entries(data?.financeiro.breakdownPagamento ?? {}).map(([forma, valor]) => ({
    name: FORMA_PAGAMENTO_LABELS[forma] ?? forma,
    value: valor,
  }));

  const totalFaturamento12m = faturamentoMensal.reduce((s, m) => s + m.valor, 0);
  const melhorMes = faturamentoMensal.reduce((best, m) => m.valor > best.valor ? m : best, { label: "-", valor: 0 });

  return (
    <AppLayout title="Relatórios">
      <div className="space-y-6">

        {/* ── Faturamento 12 meses ─────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Faturamento — Últimos 12 Meses
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Total: <strong className="text-foreground">{formatCurrency(totalFaturamento12m)}</strong>
                  {melhorMes.valor > 0 && (
                    <> · Melhor mês: <strong className="text-foreground">{melhorMes.label} ({formatCurrency(melhorMes.valor)})</strong></>
                  )}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => exportCSV("faturamento-12-meses.csv", faturamentoMensal)}>
                <Download className="w-3 h-3 mr-1" />CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={faturamentoMensal} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradFat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B4F8A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1B4F8A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Area type="monotone" dataKey="valor" stroke="#1B4F8A" strokeWidth={2} fill="url(#gradFat)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ── Ranking de Técnicos ──────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                Ranking de Técnicos
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => exportCSV("ranking-tecnicos.csv", rankingTecnicos)}>
                <Download className="w-3 h-3 mr-1" />CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {rankingTecnicos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma OS concluída ainda.</p>
            ) : (
              <div className="space-y-3">
                {rankingTecnicos.map((t, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      i === 0 ? "bg-amber-100 text-amber-700" :
                      i === 1 ? "bg-slate-100 text-slate-600" :
                      i === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{t.nome}</p>
                      <p className="text-xs text-muted-foreground">{t.osConcluidas} OS concluídas</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-sm text-primary">{formatCurrency(t.faturamento)}</p>
                      <p className="text-xs text-muted-foreground">faturado</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── OS por Status + Pagamento ────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />OS por Status
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => exportCSV("os-por-status.csv", osPorStatusData)}>
                  <Download className="w-3 h-3 mr-1" />CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={osPorStatusData}>
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1B4F8A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm">Faturamento por Pagamento</CardTitle>
                <Button size="sm" variant="outline" onClick={() => exportCSV("faturamento-pagamento.csv", pagamentoData)}>
                  <Download className="w-3 h-3 mr-1" />CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pagamentoData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pagamentoData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* ── Tabela de OS ─────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />Todas as Ordens de Serviço
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() =>
                exportCSV("ordens-servico.csv", os.map((o) => ({
                  numero: o.numero, status: OS_STATUS_LABELS[o.status] ?? o.status,
                  cliente: o.clienteNome, equipamento: `${o.equipamentoMarca} ${o.equipamentoModelo}`,
                  valor: o.valorTotal ?? 0, criado: new Date(o.createdAt).toLocaleDateString("pt-BR"),
                })))
              }>
                <Download className="w-3 h-3 mr-1" />CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs">
                    <th className="text-left py-2">Número</th>
                    <th className="text-left py-2">Cliente</th>
                    <th className="text-left py-2">Equipamento</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-right py-2">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {os.slice(0, 50).map((o) => (
                    <tr key={o.id} className="border-b last:border-0">
                      <td className="py-2 font-mono text-xs">{o.numero}</td>
                      <td className="py-2">{o.clienteNome}</td>
                      <td className="py-2 text-xs text-muted-foreground">{o.equipamentoMarca} {o.equipamentoModelo}</td>
                      <td className="py-2 text-xs">
                        <Badge variant="outline" className="text-xs">{OS_STATUS_LABELS[o.status] ?? o.status}</Badge>
                      </td>
                      <td className="py-2 text-right font-medium">
                        {o.valorTotal ? formatCurrency(parseFloat(String(o.valorTotal))) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>
    </AppLayout>
  );
}
