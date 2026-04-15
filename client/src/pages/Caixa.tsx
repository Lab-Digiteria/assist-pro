import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FORMA_PAGAMENTO_LABELS } from "../../../shared/utils";

function fmtCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export default function Caixa() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ tipo: "entrada" as "entrada" | "saida", descricao: "", valor: 0, formaPagamento: "dinheiro" });
  const utils = trpc.useUtils();
  const { data: lancamentos = [], isLoading } = trpc.financeiro.caixaList.useQuery({});
  const create = trpc.financeiro.caixaAddManual.useMutation({
    onSuccess: () => {
      toast.success("Lançamento registrado!");
      setOpen(false);
      utils.financeiro.caixaList.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const totalEntradas = lancamentos.filter((l) => l.tipo === "entrada").reduce((s, l) => s + parseFloat(String(l.valor)), 0);
  const totalSaidas = lancamentos.filter((l) => l.tipo === "saida").reduce((s, l) => s + parseFloat(String(l.valor)), 0);

  return (
    <AppLayout title="Caixa">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-xs text-muted-foreground">Entradas</p>
              <p className="text-xl font-bold text-green-600">{fmtCurrency(totalEntradas)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-xs text-muted-foreground">Saídas</p>
              <p className="text-xl font-bold text-destructive">{fmtCurrency(totalSaidas)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-xs text-muted-foreground">Saldo</p>
              <p className={`text-xl font-bold ${totalEntradas - totalSaidas >= 0 ? "text-primary" : "text-destructive"}`}>
                {fmtCurrency(totalEntradas - totalSaidas)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button style={{ background: "#1B4F8A" }}>
                <Plus className="w-4 h-4 mr-2" />Lançamento Manual
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Lançamento Manual</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Descrição *</Label><Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
                <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: parseFloat(e.target.value) })} /></div>
                <div>
                  <Label>Forma de Pagamento</Label>
                  <Select value={form.formaPagamento} onValueChange={(v) => setForm({ ...form, formaPagamento: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(FORMA_PAGAMENTO_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" style={{ background: "#1B4F8A" }} onClick={() => create.mutate(form)} disabled={create.isPending}>
                  {create.isPending ? "Salvando..." : "Registrar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : lancamentos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Nenhum lançamento registrado.</div>
        ) : (
          <div className="space-y-2">
            {lancamentos.map((l) => (
              <Card key={l.id}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${l.tipo === "entrada" ? "bg-green-100" : "bg-red-100"}`}>
                    {l.tipo === "entrada" ? <TrendingUp className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{l.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      {l.formaPagamento ? FORMA_PAGAMENTO_LABELS[l.formaPagamento] ?? l.formaPagamento : ""} · {new Date(l.createdAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <span className={`font-bold ${l.tipo === "entrada" ? "text-green-600" : "text-destructive"}`}>
                    {l.tipo === "saida" ? "-" : "+"}{fmtCurrency(parseFloat(String(l.valor)))}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
