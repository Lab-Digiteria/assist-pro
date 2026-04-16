import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileDown } from "lucide-react";

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}
function pct(part: number, total: number) {
  if (!total) return "—";
  return ((part / total) * 100).toFixed(1) + "%";
}
function delta(current: number, previous: number | undefined) {
  if (previous === undefined || previous === 0) return null;
  const d = ((current - previous) / Math.abs(previous)) * 100;
  return d;
}

function getDefaultRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  const prevFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
  const prevTo = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
  return { from, to, prevFrom, prevTo };
}

type DREKey = "receitaBruta" | "deducoes" | "receitaLiquida" | "cpv" | "lucroBruto" | "despesasPessoal" | "despesasInstalacoes" | "despesasEquipamentos" | "despesasAdm" | "despesasComercial" | "despesasDiversas" | "totalDespesasOp" | "resultadoOperacional" | "despesasFinanceiras" | "resultadoLiquido";

type DRERow = {
  label: string;
  key: DREKey;
  indent?: number;
  bold?: boolean;
  separator?: boolean;
  negative?: boolean;
};

const DRE_ROWS: DRERow[] = [
  { label: "Receita Bruta", key: "receitaBruta", bold: true },
  { label: "  Deduções / Impostos", key: "deducoes", indent: 1, negative: true },
  { label: "Receita Líquida", key: "receitaLiquida", bold: true, separator: true },
  { label: "  Custo dos Produtos/Serviços (CPV)", key: "cpv", indent: 1, negative: true },
  { label: "Lucro Bruto", key: "lucroBruto", bold: true, separator: true },
  { label: "  Pessoal e Salários", key: "despesasPessoal", indent: 1, negative: true },
  { label: "  Instalações e Aluguel", key: "despesasInstalacoes", indent: 1, negative: true },
  { label: "  Equipamentos e Ferramentas", key: "despesasEquipamentos", indent: 1, negative: true },
  { label: "  Administrativo", key: "despesasAdm", indent: 1, negative: true },
  { label: "  Comercial e Marketing", key: "despesasComercial", indent: 1, negative: true },
  { label: "  Outras Despesas", key: "despesasDiversas", indent: 1, negative: true },
  { label: "Total Despesas Operacionais", key: "totalDespesasOp", bold: true, negative: true },
  { label: "Resultado Operacional (EBITDA)", key: "resultadoOperacional", bold: true, separator: true },
  { label: "  Despesas Financeiras", key: "despesasFinanceiras", indent: 1, negative: true },
  { label: "Resultado Líquido", key: "resultadoLiquido", bold: true, separator: true },
];

export default function DRE() {
  const defaults = getDefaultRange();
  const [range, setRange] = useState({ from: defaults.from, to: defaults.to });
  const [compare, setCompare] = useState({ from: defaults.prevFrom, to: defaults.prevTo });
  const [showCompare, setShowCompare] = useState(false);

  const { data, isLoading } = trpc.financeiroV2.dre.useQuery({
    from: range.from,
    to: range.to,
    compareFrom: showCompare ? compare.from : undefined,
    compareTo: showCompare ? compare.to : undefined,
  });

  const current = data?.current;
  const previous = data?.previous;

  const handleExport = () => {
    if (!current) return;
    const lines = [
      "DRE — Demonstrativo de Resultado",
      `Período: ${range.from} a ${range.to}`,
      "",
        ...DRE_ROWS.map(row => {
        const val = (current as Record<string, number>)[row.key as string] ?? 0;
        return `${row.label.trim()};${fmt(val)}`;
      }),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `DRE_${range.from}_${range.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout title="DRE">
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">DRE — Demonstrativo de Resultado</h1>
            <p className="text-muted-foreground text-sm">Análise de receitas, custos e resultado líquido</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCompare(v => !v)}>
              {showCompare ? "Ocultar comparativo" : "Comparar períodos"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={!current}>
              <FileDown className="h-4 w-4 mr-2" /> Exportar CSV
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-4 flex-wrap items-end">
          <div className="flex gap-3 items-end border rounded-lg p-3">
            <div>
              <Label className="text-xs">Período — De</Label>
              <Input type="date" value={range.from} onChange={e => setRange(r => ({ ...r, from: e.target.value }))} className="w-36" />
            </div>
            <div>
              <Label className="text-xs">Até</Label>
              <Input type="date" value={range.to} onChange={e => setRange(r => ({ ...r, to: e.target.value }))} className="w-36" />
            </div>
          </div>
          {showCompare && (
            <div className="flex gap-3 items-end border rounded-lg p-3 bg-muted/30">
              <div>
                <Label className="text-xs text-muted-foreground">Comparar — De</Label>
                <Input type="date" value={compare.from} onChange={e => setCompare(r => ({ ...r, from: e.target.value }))} className="w-36" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Até</Label>
                <Input type="date" value={compare.to} onChange={e => setCompare(r => ({ ...r, to: e.target.value }))} className="w-36" />
              </div>
            </div>
          )}
        </div>

        {/* Tabela DRE */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Conta</th>
                      <th className="text-right p-3 font-medium">Valor</th>
                      <th className="text-right p-3 font-medium">% Receita</th>
                      {showCompare && previous && (
                        <>
                          <th className="text-right p-3 font-medium text-muted-foreground">Anterior</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">Var %</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {DRE_ROWS.map((row, idx) => {
                      const val = current ? ((current as Record<string, number>)[row.key as string] ?? 0) : 0;
                      const prevVal = previous ? ((previous as Record<string, number>)[row.key as string] ?? 0) : undefined;
                      const d = prevVal !== undefined ? delta(val, prevVal) : null;
                      const isResult = row.key === "resultadoLiquido" || row.key === "resultadoOperacional";
                      const valueColor = isResult
                        ? val >= 0 ? "text-green-600" : "text-red-600"
                        : row.negative ? "text-red-700" : "";

                      return (
                        <tr
                          key={idx}
                          className={`border-b ${row.separator ? "border-t-2 border-primary/20" : ""} ${row.bold ? "bg-muted/20" : "hover:bg-muted/10"}`}
                        >
                          <td className={`p-3 ${row.bold ? "font-semibold" : ""}`} style={{ paddingLeft: `${12 + (row.indent ?? 0) * 16}px` }}>
                            {row.label}
                          </td>
                          <td className={`p-3 text-right font-${row.bold ? "bold" : "medium"} ${valueColor}`}>
                            {fmt(val)}
                          </td>
                          <td className="p-3 text-right text-muted-foreground text-xs">
                            {current ? pct(val, current.receitaBruta) : "—"}
                          </td>
                          {showCompare && previous && (
                            <>
                              <td className="p-3 text-right text-muted-foreground">{fmt(prevVal ?? 0)}</td>
                              <td className="p-3 text-right">
                                {d !== null ? (
                                  <span className={`text-xs font-medium ${d >= 0 ? "text-green-600" : "text-red-600"}`}>
                                    {d >= 0 ? "+" : ""}{d.toFixed(1)}%
                                  </span>
                                ) : "—"}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
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
