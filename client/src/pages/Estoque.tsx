import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, AlertTriangle, Package } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

const CATEGORIAS_PECA = ["tela", "bateria", "conector", "cabo", "placa", "chip", "acessorio", "outro"];
const CAT_LABELS: Record<string, string> = {
  tela: "Tela", bateria: "Bateria", conector: "Conector", cabo: "Cabo",
  placa: "Placa", chip: "Chip", acessorio: "Acessório", outro: "Outro",
};

export default function Estoque() {
  const { user } = useAuth();
  const isManager = user?.role === "admin";
  const [open, setOpen] = useState(false);
  const [movOpen, setMovOpen] = useState(false);
  const [selectedPeca, setSelectedPeca] = useState<number | null>(null);
  const [form, setForm] = useState({ nome: "", categoria: "tela" as any, precoCusto: 0, precoVenda: 0, quantidadeAtual: 0, quantidadeMinima: 1 });
  const [movForm, setMovForm] = useState({ tipo: "entrada" as any, quantidade: 1, observacao: "" });
  const utils = trpc.useUtils();
  const { data: pecas = [], isLoading } = trpc.estoque.list.useQuery();
  const create = trpc.estoque.create.useMutation({
    onSuccess: () => { toast.success("Peça cadastrada!"); setOpen(false); utils.estoque.list.invalidate(); },
    onError: e => toast.error(e.message),
  });
  const movimentar = trpc.estoque.movimentar.useMutation({
    onSuccess: () => { toast.success("Movimentação registrada!"); setMovOpen(false); utils.estoque.list.invalidate(); },
    onError: e => toast.error(e.message),
  });

  const abaixoMinimo = pecas.filter(p => p.quantidadeAtual < p.quantidadeMinima);

  return (
    <AppLayout title="Estoque">
      <div className="space-y-4">
        {abaixoMinimo.length > 0 && (
          <div className="rounded-xl border-2 border-orange-200 bg-orange-50 p-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <span className="text-sm text-orange-700 font-medium">{abaixoMinimo.length} peça(s) abaixo do estoque mínimo</span>
          </div>
        )}
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button style={{ background: "#1B4F8A" }}><Plus className="w-4 h-4 mr-2" />Nova Peça</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Cadastrar Peça</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nome *</Label><Input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} /></div>
                <div><Label>Categoria</Label>
                  <Select value={form.categoria} onValueChange={v => setForm({...form, categoria: v as any})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIAS_PECA.map(c => <SelectItem key={c} value={c}>{CAT_LABELS[c]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {isManager && <div><Label>Preço de Custo (R$)</Label><Input type="number" step="0.01" value={form.precoCusto} onChange={e => setForm({...form, precoCusto: parseFloat(e.target.value)})} /></div>}
                  <div><Label>Preço de Venda (R$)</Label><Input type="number" step="0.01" value={form.precoVenda} onChange={e => setForm({...form, precoVenda: parseFloat(e.target.value)})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Qtd. Inicial</Label><Input type="number" min={0} value={form.quantidadeAtual} onChange={e => setForm({...form, quantidadeAtual: parseInt(e.target.value)})} /></div>
                  <div><Label>Qtd. Mínima</Label><Input type="number" min={0} value={form.quantidadeMinima} onChange={e => setForm({...form, quantidadeMinima: parseInt(e.target.value)})} /></div>
                </div>
                <Button className="w-full" style={{ background: "#1B4F8A" }} onClick={() => create.mutate(form)} disabled={create.isPending}>
                  {create.isPending ? "Salvando..." : "Cadastrar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? <div className="text-center py-12 text-muted-foreground">Carregando...</div> :
          pecas.length === 0 ? <div className="text-center py-12 text-muted-foreground">Nenhuma peça cadastrada.</div> :
          <div className="grid gap-3">
            {pecas.map(p => {
              const baixo = p.quantidadeAtual < p.quantidadeMinima;
              return (
                <Card key={p.id} className={baixo ? "border-orange-200" : ""}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${baixo ? "bg-orange-100" : "bg-primary/10"}`}>
                      <Package className={`w-5 h-5 ${baixo ? "text-orange-600" : "text-primary"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{p.nome}</p>
                        <Badge variant="outline" className="text-xs">{CAT_LABELS[p.categoria] ?? p.categoria}</Badge>
                        {baixo && <Badge className="text-xs bg-orange-100 text-orange-700">Estoque Baixo</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{p.codigo}</p>
                      <div className="flex gap-4 mt-1 text-sm">
                        <span>Atual: <strong>{p.quantidadeAtual}</strong></span>
                        <span className="text-muted-foreground">Mín: {p.quantidadeMinima}</span>
                        <span>Venda: <strong>R$ {parseFloat(String(p.precoVenda)).toFixed(2)}</strong></span>
                        {isManager && p.precoCusto && <span className="text-muted-foreground">Custo: R$ {parseFloat(String(p.precoCusto)).toFixed(2)}</span>}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => { setSelectedPeca(p.id); setMovOpen(true); }}>Movimentar</Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        }

        <Dialog open={movOpen} onOpenChange={setMovOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Movimentar Estoque</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Tipo</Label>
                <Select value={movForm.tipo} onValueChange={v => setMovForm({...movForm, tipo: v as any})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                    <SelectItem value="ajuste">Ajuste de Inventário</SelectItem>
                    <SelectItem value="devolucao">Devolução</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Quantidade</Label><Input type="number" min={1} value={movForm.quantidade} onChange={e => setMovForm({...movForm, quantidade: parseInt(e.target.value)})} /></div>
              <div><Label>Observação</Label><Input value={movForm.observacao} onChange={e => setMovForm({...movForm, observacao: e.target.value})} /></div>
              <Button className="w-full" style={{ background: "#1B4F8A" }} disabled={movimentar.isPending} onClick={() => selectedPeca && movimentar.mutate({ pecaId: selectedPeca, ...movForm })}>
                {movimentar.isPending ? "Salvando..." : "Confirmar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
