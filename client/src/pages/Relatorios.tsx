import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download, BarChart3 } from "lucide-react";
import { OS_STATUS_LABELS, FORMA_PAGAMENTO_LABELS } from "../../../shared/utils";
import { toast } from "sonner";

const COLORS = ["#1B4F8A", "#C4733A", "#E8C547", "#6B7280", "#10b981"];

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

export default function Relatorios() {
  const { data } = trpc.financeiro.dashboard.useQuery();
  const { data: os = [] } = trpc.os.list.useQuery({});

  const osPorStatusData = Object.entries(data?.osPorStatus ?? {}).map(([status, count]) => ({
    name: OS_STATUS_LABELS[status] ?? status,
    value: count,
  }));

  const pagamentoData = Object.entries(data?.financeiro.breakdownPagamento ?? {}).map(([forma, valor]) => ({
    name: FORMA_PAGAMENTO_LABELS[forma] ?? forma,
    value: valor,
  }));

  return (
    <AppLayout title="Relatórios">
      <div className="space-y-6">
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
                  <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm">Todas as Ordens de Serviço</CardTitle>
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
                      <td className="py-2 text-xs">{OS_STATUS_LABELS[o.status] ?? o.status}</td>
                      <td className="py-2 text-right font-medium">
                        {o.valorTotal ? `R$ ${parseFloat(String(o.valorTotal)).toFixed(2)}` : "-"}
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
