import { useState, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, CheckCircle, AlertTriangle, X, ArrowRight } from "lucide-react";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ParsedTransaction {
  id: string;
  date: string;       // YYYY-MM-DD
  description: string;
  amount: number;     // positive = credit, negative = debit
  type: "entrada" | "saida";
  isDuplicate: boolean;
  selected: boolean;
  chartAccountId?: number;
  bankAccountId?: number;
}

// ─── OFX Parser (client-side, sem dependências) ──────────────────────────────

function parseOFX(text: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  // Suporta OFX/QFX (SGML-like)
  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;
  while ((match = stmtTrnRegex.exec(text)) !== null) {
    const block = match[1];
    const get = (tag: string) => {
      const m = new RegExp(`<${tag}>([^<\n\r]+)`, "i").exec(block);
      return m ? m[1].trim() : "";
    };
    const rawDate = get("DTPOSTED");
    const rawAmt = get("TRNAMT");
    const memo = get("MEMO") || get("NAME") || "Transação";
    const fitid = get("FITID") || String(Date.now() + Math.random());

    if (!rawDate || !rawAmt) continue;

    // Parse date: YYYYMMDD or YYYYMMDDHHMMSS
    const y = rawDate.slice(0, 4);
    const mo = rawDate.slice(4, 6);
    const d = rawDate.slice(6, 8);
    const date = `${y}-${mo}-${d}`;

    const amount = parseFloat(rawAmt.replace(",", "."));
    if (isNaN(amount)) continue;

    transactions.push({
      id: fitid,
      date,
      description: memo,
      amount,
      type: amount >= 0 ? "entrada" : "saida",
      isDuplicate: false,
      selected: true,
    });
  }
  return transactions;
}

function parseCSV(text: string): ParsedTransaction[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines[0].split(/[,;]/).map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
  const dateIdx = header.findIndex((h) => h.includes("data") || h === "date");
  const descIdx = header.findIndex((h) => h.includes("descri") || h.includes("memo") || h.includes("hist") || h === "description");
  const amtIdx = header.findIndex((h) => h.includes("valor") || h.includes("amount") || h.includes("value"));
  if (dateIdx === -1 || amtIdx === -1) return [];

  const transactions: ParsedTransaction[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(/[,;]/).map((c) => c.trim().replace(/^["']|["']$/g, ""));
    const rawDate = cols[dateIdx] ?? "";
    const rawAmt = (cols[amtIdx] ?? "").replace(/[R$\s.]/g, "").replace(",", ".");
    const desc = descIdx >= 0 ? (cols[descIdx] ?? `Linha ${i}`) : `Linha ${i}`;

    // Normalizar data: DD/MM/YYYY → YYYY-MM-DD
    let date = rawDate;
    const dmyMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(rawDate);
    if (dmyMatch) date = `${dmyMatch[3]}-${dmyMatch[2].padStart(2, "0")}-${dmyMatch[1].padStart(2, "0")}`;

    const amount = parseFloat(rawAmt);
    if (isNaN(amount) || !date) continue;

    transactions.push({
      id: `csv-${i}-${Date.now()}`,
      date,
      description: desc,
      amount,
      type: amount >= 0 ? "entrada" : "saida",
      isDuplicate: false,
      selected: true,
    });
  }
  return transactions;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ImportarExtrato() {
  const [step, setStep] = useState<"upload" | "review" | "done">("upload");
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [fileName, setFileName] = useState("");

  const { data: chartAccounts = [] } = trpc.financeiroV2.chartOfAccounts.list.useQuery();
  const { data: bankAccounts = [] } = trpc.financeiroV2.bankAccounts.list.useQuery();

  const createReceivable = trpc.financeiroV2.receivables.create.useMutation();
  const createPayable = trpc.financeiroV2.payables.create.useMutation();

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      let parsed: ParsedTransaction[] = [];
      const lower = file.name.toLowerCase();
      if (lower.endsWith(".ofx") || lower.endsWith(".qfx")) {
        parsed = parseOFX(text);
      } else if (lower.endsWith(".csv") || lower.endsWith(".txt")) {
        parsed = parseCSV(text);
      } else {
        toast.error("Formato não suportado. Use OFX, QFX ou CSV.");
        return;
      }
      if (parsed.length === 0) {
        toast.error("Nenhuma transação encontrada no arquivo.");
        return;
      }
      setTransactions(parsed);
      setStep("review");
      toast.success(`${parsed.length} transações encontradas`);
    };
    reader.readAsText(file, "latin1");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const toggleSelect = (id: string) => {
    setTransactions((prev) => prev.map((t) => t.id === id ? { ...t, selected: !t.selected } : t));
  };

  const setCategory = (id: string, chartAccountId: number) => {
    setTransactions((prev) => prev.map((t) => t.id === id ? { ...t, chartAccountId } : t));
  };

  const setBankAccount = (id: string, bankAccountId: number) => {
    setTransactions((prev) => prev.map((t) => t.id === id ? { ...t, bankAccountId } : t));
  };

  const handleImport = async () => {
    const selected = transactions.filter((t) => t.selected && !t.isDuplicate);
    if (selected.length === 0) { toast.error("Nenhuma transação selecionada"); return; }
    setImporting(true);
    let count = 0;
    for (const t of selected) {
      try {
        const abs = Math.abs(t.amount);
        if (t.type === "entrada") {
          await createReceivable.mutateAsync({
            description: `[Importado] ${t.description}`,
            amount: abs,
            dueDate: t.date,
            chartOfAccountId: t.chartAccountId,
            bankAccountId: t.bankAccountId,
          });
        } else {
          await createPayable.mutateAsync({
            description: `[Importado] ${t.description}`,
            amount: abs,
            dueDate: t.date,
            chartOfAccountId: t.chartAccountId,
            bankAccountId: t.bankAccountId,
          });
        }
        count++;
      } catch {
        // continua mesmo se uma falhar
      }
    }
    setImportedCount(count);
    setStep("done");
    setImporting(false);
    toast.success(`${count} transações importadas com sucesso!`);
  };

  const selectedCount = transactions.filter((t) => t.selected && !t.isDuplicate).length;
  const entradas = transactions.filter((t) => t.type === "entrada" && t.selected);
  const saidas = transactions.filter((t) => t.type === "saida" && t.selected);
  const totalEntradas = entradas.reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalSaidas = saidas.reduce((s, t) => s + Math.abs(t.amount), 0);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <AppLayout title="Importar Extrato">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Stepper */}
        <div className="flex items-center gap-2 text-sm">
          {(["upload", "review", "done"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${step === s ? "bg-primary text-primary-foreground" : step === "done" && i < 2 ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                {i + 1}. {s === "upload" ? "Upload" : s === "review" ? "Revisão" : "Concluído"}
              </span>
            </div>
          ))}
        </div>

        {/* ── Step 1: Upload ─────────────────────────────────────── */}
        {step === "upload" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Selecionar arquivo de extrato</CardTitle>
              <p className="text-sm text-muted-foreground">Formatos suportados: OFX, QFX (Open Financial Exchange) e CSV</p>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">Arraste o arquivo aqui ou clique para selecionar</p>
                <p className="text-sm text-muted-foreground mt-1">OFX, QFX, CSV — até 5 MB</p>
              </div>
              <input
                id="file-input"
                type="file"
                accept=".ofx,.qfx,.csv,.txt"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />

              <div className="mt-6 p-4 bg-muted/40 rounded-lg text-sm space-y-2">
                <p className="font-medium">Dicas de importação</p>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  <li>OFX/QFX: exporte diretamente do seu banco (Bradesco, Itaú, Nubank, etc.)</li>
                  <li>CSV: deve ter colunas de data, descrição e valor</li>
                  <li>Você poderá revisar e categorizar antes de confirmar</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Step 2: Revisão ────────────────────────────────────── */}
        {step === "review" && (
          <>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="font-semibold">{fileName}</h2>
                <p className="text-sm text-muted-foreground">{transactions.length} transações encontradas · {selectedCount} selecionadas</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setStep("upload"); setTransactions([]); }}>
                  <X className="w-3 h-3 mr-1" />Cancelar
                </Button>
                <Button size="sm" onClick={handleImport} disabled={importing || selectedCount === 0}>
                  {importing ? "Importando..." : `Importar ${selectedCount} transações`}
                </Button>
              </div>
            </div>

            {/* Resumo */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="p-3">
                <p className="text-xs text-muted-foreground">Entradas</p>
                <p className="font-semibold text-emerald-600">{fmt(totalEntradas)}</p>
                <p className="text-xs text-muted-foreground">{entradas.length} transações</p>
              </Card>
              <Card className="p-3">
                <p className="text-xs text-muted-foreground">Saídas</p>
                <p className="font-semibold text-red-500">{fmt(totalSaidas)}</p>
                <p className="text-xs text-muted-foreground">{saidas.length} transações</p>
              </Card>
              <Card className="p-3">
                <p className="text-xs text-muted-foreground">Resultado</p>
                <p className={`font-semibold ${totalEntradas - totalSaidas >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {fmt(totalEntradas - totalSaidas)}
                </p>
                <p className="text-xs text-muted-foreground">período</p>
              </Card>
            </div>

            {/* Tabela de revisão */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                        <th className="w-8 p-3"></th>
                        <th className="text-left p-3">Data</th>
                        <th className="text-left p-3">Descrição</th>
                        <th className="text-right p-3">Valor</th>
                        <th className="text-left p-3 min-w-[160px]">Categoria</th>
                        <th className="text-left p-3 min-w-[140px]">Conta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((t) => (
                        <tr key={t.id} className={`border-b last:border-0 ${!t.selected ? "opacity-40" : ""} ${t.isDuplicate ? "bg-amber-50 dark:bg-amber-950/20" : ""}`}>
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={t.selected && !t.isDuplicate}
                              disabled={t.isDuplicate}
                              onChange={() => toggleSelect(t.id)}
                              className="rounded"
                            />
                          </td>
                          <td className="p-3 text-xs font-mono whitespace-nowrap">
                            {new Date(t.date + "T12:00:00").toLocaleDateString("pt-BR")}
                          </td>
                          <td className="p-3 max-w-[200px]">
                            <p className="truncate">{t.description}</p>
                            {t.isDuplicate && (
                              <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 mt-0.5">
                                <AlertTriangle className="w-3 h-3 mr-1" />Possível duplicata
                              </Badge>
                            )}
                          </td>
                          <td className={`p-3 text-right font-medium whitespace-nowrap ${t.type === "entrada" ? "text-emerald-600" : "text-red-500"}`}>
                            {t.type === "entrada" ? "+" : "-"}{fmt(Math.abs(t.amount))}
                          </td>
                          <td className="p-3">
                            <Select
                              value={t.chartAccountId?.toString() ?? ""}
                              onValueChange={(v) => setCategory(t.id, parseInt(v))}
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue placeholder="Selecionar..." />
                              </SelectTrigger>
                              <SelectContent>
                                {chartAccounts
                                  .filter((a) => a.type === (t.type === "entrada" ? "receita" : "despesa"))
                                  .map((a) => (
                                    <SelectItem key={a.id} value={a.id.toString()}>
                                      {a.code} — {a.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3">
                            <Select
                              value={t.bankAccountId?.toString() ?? ""}
                              onValueChange={(v) => setBankAccount(t.id, parseInt(v))}
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue placeholder="Conta..." />
                              </SelectTrigger>
                              <SelectContent>
                                {bankAccounts.map((a) => (
                                  <SelectItem key={a.id} value={a.id.toString()}>
                                    {a.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ── Step 3: Concluído ──────────────────────────────────── */}
        {step === "done" && (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto" />
              <div>
                <h2 className="text-xl font-semibold">Importação concluída!</h2>
                <p className="text-muted-foreground mt-1">
                  <strong>{importedCount}</strong> transações foram importadas com sucesso.
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => { setStep("upload"); setTransactions([]); setImportedCount(0); }}>
                  Importar outro arquivo
                </Button>
                <Button onClick={() => window.location.href = "/financeiro/contas-receber"}>
                  Ver Contas a Receber
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
