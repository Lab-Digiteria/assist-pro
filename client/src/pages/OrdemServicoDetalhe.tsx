import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, DollarSign, History, Package } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { OS_STATUS_LABELS, OS_STATUS_COLORS, FORMA_PAGAMENTO_LABELS } from "../../../shared/utils";

const STATUS_FLOW = ["recebido","em_diagnostico","aguardando_aprovacao","em_reparo","concluido","pronto_aguardando_retirada","encerrado"] as const;

export default function OrdemServicoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const osId = Number(id);
  const isValidId = !isNaN(osId) && osId > 0;
  const utils = trpc.useUtils();
  const { data: os, isLoading } = trpc.os.get.useQuery({ id: osId }, { enabled: isValidId });
  const { data: itens = [] } = trpc.os.itens.useQuery({ osId }, { enabled: isValidId });
  const { data: lancamentos = [] } = trpc.os.lancamentos.useQuery({ osId }, { enabled: isValidId });
  const { data: history = [] } = trpc.os.history.useQuery({ osId }, { enabled: isValidId });
  const [itemForm, setItemForm] = useState({ tipo: "servico" as "servico"|"peca", descricao: "", quantidade: 1, valorUnitario: 0 });
  const [lancForm, setLancForm] = useState({ tipo: "pagamento_final" as any, formaPagamento: "pix" as any, valor: 0, observacao: "" });
  const [statusObs, setStatusObs] = useState("");
  const [nextStatus, setNextStatus] = useState("");
  const [openItem, setOpenItem] = useState(false);
  const [openLanc, setOpenLanc] = useState(false);
  const [openStatus, setOpenStatus] = useState(false);

  const addItem = trpc.os.addItem.useMutation({ onSuccess: () => { toast.success("Item adicionado!"); setOpenItem(false); utils.os.itens.invalidate(); utils.os.get.invalidate(); }, onError: e => toast.error(e.message) });
  const addLanc = trpc.os.addLancamento.useMutation({ onSuccess: () => { toast.success("Lançamento registrado!"); setOpenLanc(false); utils.os.lancamentos.invalidate(); utils.os.get.invalidate(); }, onError: e => toast.error(e.message) });
  const updateStatus = trpc.os.updateStatus.useMutation({ onSuccess: () => { toast.success("Status atualizado!"); setOpenStatus(false); utils.os.get.invalidate(); utils.os.history.invalidate(); }, onError: e => toast.error(e.message) });
  const removeItem = trpc.os.removeItem.useMutation({ onSuccess: () => { utils.os.itens.invalidate(); utils.os.get.invalidate(); } });

  if (isLoading) return <AppLayout><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div></AppLayout>;
  if (!os) return <AppLayout><div className="text-center py-12">OS não encontrada.</div></AppLayout>;

  const curIdx = STATUS_FLOW.indexOf(os.status as any);
  const availableNext = STATUS_FLOW.slice(curIdx + 1);
  const totalPago = parseFloat(String(os.valorPago ?? 0));
  const totalOS = parseFloat(String(os.valorTotal ?? 0));
  const saldo = totalOS - totalPago;

  return (
    <AppLayout title={`OS ${os.numero}`}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/ordens-servico"><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Voltar</Button></Link>
          <Badge className={`${OS_STATUS_COLORS[os.status] ?? "bg-gray-100 text-gray-700"}`}>{OS_STATUS_LABELS[os.status] ?? os.status}</Badge>
          {(availableNext.length > 0 || os.status !== "encerrado") && (
            <Dialog open={openStatus} onOpenChange={setOpenStatus}>
              <DialogTrigger asChild><Button size="sm" style={{ background: "#C4733A" }}>Avançar Status</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Avançar Status</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Novo status</Label>
                    <Select value={nextStatus} onValueChange={setNextStatus}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {availableNext.map(s => <SelectItem key={s} value={s}>{OS_STATUS_LABELS[s]}</SelectItem>)}
                        {!["encerrado","cancelado","devolvido_sem_reparo"].includes(os.status) && (
                          <>
                            <SelectItem value="cancelado">Cancelado</SelectItem>
                            <SelectItem value="devolvido_sem_reparo">Devolvido sem Reparo</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Observação</Label><Textarea value={statusObs} onChange={e => setStatusObs(e.target.value)} rows={2} /></div>
                  <Button className="w-full" style={{ background: "#1B4F8A" }} disabled={!nextStatus || updateStatus.isPending} onClick={() => updateStatus.mutate({ id: osId, status: nextStatus as any, observacao: statusObs })}>
                    {updateStatus.isPending ? "Salvando..." : "Confirmar"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Info */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Informações</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Número</span><span className="font-mono font-semibold">{os.numero}</span></div>
              {os.prazoOrcamento && <div className="flex justify-between"><span className="text-muted-foreground">Prazo</span><span>{new Date(os.prazoOrcamento).toLocaleDateString("pt-BR")}</span></div>}
              {os.senhaDesbloqueio && <div className="flex justify-between"><span className="text-muted-foreground">Senha</span><span className="font-mono">{os.senhaDesbloqueio}</span></div>}
              {os.descricaoProblema && <div className="pt-2"><p className="text-muted-foreground text-xs mb-1">Problema relatado</p><p>{os.descricaoProblema}</p></div>}
            </CardContent>
          </Card>

          {/* Financeiro */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm">Financeiro</CardTitle>
                <Dialog open={openLanc} onOpenChange={setOpenLanc}>
                  <DialogTrigger asChild><Button size="sm" variant="outline"><DollarSign className="w-3 h-3 mr-1" />Registrar Pagamento</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Registrar Pagamento</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div><Label>Tipo</Label>
                        <Select value={lancForm.tipo} onValueChange={v => setLancForm({...lancForm, tipo: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sinal">Sinal</SelectItem>
                            <SelectItem value="antecipacao">Antecipação</SelectItem>
                            <SelectItem value="pagamento_final">Pagamento Final</SelectItem>
                            <SelectItem value="estorno">Estorno</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label>Forma de Pagamento</Label>
                        <Select value={lancForm.formaPagamento} onValueChange={v => setLancForm({...lancForm, formaPagamento: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(FORMA_PAGAMENTO_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={lancForm.valor} onChange={e => setLancForm({...lancForm, valor: parseFloat(e.target.value)})} /></div>
                      <div><Label>Observação</Label><Input value={lancForm.observacao} onChange={e => setLancForm({...lancForm, observacao: e.target.value})} /></div>
                      <Button className="w-full" style={{ background: "#1B4F8A" }} disabled={addLanc.isPending} onClick={() => addLanc.mutate({ osId, ...lancForm })}>
                        {addLanc.isPending ? "Salvando..." : "Registrar"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Total OS</span><span className="font-semibold">R$ {totalOS.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Pago</span><span className="text-green-600 font-semibold">R$ {totalPago.toFixed(2)}</span></div>
              <div className="flex justify-between border-t pt-2"><span className="font-medium">Saldo</span><span className={`font-bold ${saldo > 0 ? "text-destructive" : "text-green-600"}`}>R$ {saldo.toFixed(2)}</span></div>
              {lancamentos.map(l => (
                <div key={l.id} className="flex justify-between text-xs text-muted-foreground">
                  <span>{FORMA_PAGAMENTO_LABELS[l.formaPagamento ?? ""] ?? l.formaPagamento} — {l.tipo}</span>
                  <span>R$ {parseFloat(String(l.valor)).toFixed(2)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Itens */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm flex items-center gap-2"><Package className="w-4 h-4" />Serviços e Peças</CardTitle>
              <Dialog open={openItem} onOpenChange={setOpenItem}>
                <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="w-3 h-3 mr-1" />Adicionar</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Adicionar Item</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Tipo</Label>
                      <Select value={itemForm.tipo} onValueChange={v => setItemForm({...itemForm, tipo: v as any})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="servico">Serviço</SelectItem><SelectItem value="peca">Peça</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div><Label>Descrição *</Label><Input value={itemForm.descricao} onChange={e => setItemForm({...itemForm, descricao: e.target.value})} /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><Label>Qtd</Label><Input type="number" min={1} value={itemForm.quantidade} onChange={e => setItemForm({...itemForm, quantidade: parseInt(e.target.value)})} /></div>
                      <div><Label>Valor Unit. (R$)</Label><Input type="number" step="0.01" value={itemForm.valorUnitario} onChange={e => setItemForm({...itemForm, valorUnitario: parseFloat(e.target.value)})} /></div>
                    </div>
                    <Button className="w-full" style={{ background: "#1B4F8A" }} disabled={addItem.isPending} onClick={() => addItem.mutate({ osId, ...itemForm })}>
                      {addItem.isPending ? "Salvando..." : "Adicionar"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {itens.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Nenhum item adicionado.</p> :
              <div className="space-y-1">
                {itens.map(i => (
                  <div key={i.id} className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm">
                    <div>
                      <span className="font-medium">{i.descricao}</span>
                      <span className="text-muted-foreground ml-2">x{i.quantidade}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">R$ {parseFloat(String(i.valorTotal)).toFixed(2)}</span>
                      <button onClick={() => removeItem.mutate({ itemId: i.id })} className="text-destructive text-xs hover:underline">remover</button>
                    </div>
                  </div>
                ))}
              </div>
            }
          </CardContent>
        </Card>

        {/* Histórico */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><History className="w-4 h-4" />Histórico</CardTitle></CardHeader>
          <CardContent>
            {history.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Sem histórico.</p> :
              <div className="space-y-2">
                {history.map(h => (
                  <div key={h.id} className="flex gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">{OS_STATUS_LABELS[h.statusNovo] ?? h.statusNovo}</span>
                      {h.observacao && <p className="text-muted-foreground text-xs">{h.observacao}</p>}
                      <p className="text-xs text-muted-foreground">{new Date(h.createdAt).toLocaleString("pt-BR")}</p>
                    </div>
                  </div>
                ))}
              </div>
            }
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
