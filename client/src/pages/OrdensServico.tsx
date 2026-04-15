import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, ChevronRight, Clock, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";
import { OS_STATUS_LABELS, OS_STATUS_COLORS } from "../../../shared/utils";

const CHECKLIST_ESTADO_FISICO = [
  "tela", "carcaca", "parafusos", "botoes", "conector", "jack",
  "slot_sim", "lente_camera", "tampa_traseira", "indicios_liquido", "bateria"
];

const CHECKLIST_SINTOMAS = [
  "energia", "tela_display", "desempenho", "bateria_autonomia",
  "wifi_bluetooth", "camera", "audio_microfone", "touch", "carregamento"
];

const CHECKLIST_LABELS: Record<string, string> = {
  tela: "Tela", carcaca: "Carcaça", parafusos: "Parafusos", botoes: "Botões",
  conector: "Conector de carga", jack: "Jack de áudio", slot_sim: "Slot SIM",
  lente_camera: "Lente câmera", tampa_traseira: "Tampa traseira",
  indicios_liquido: "Indícios de líquido", bateria: "Bateria",
  energia: "Liga/Desliga", tela_display: "Tela/Display", desempenho: "Desempenho",
  bateria_autonomia: "Bateria/Autonomia", wifi_bluetooth: "Wi-Fi/Bluetooth",
  camera: "Câmera", audio_microfone: "Áudio/Microfone", touch: "Touch",
  carregamento: "Carregamento",
};

export default function OrdensServico() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    clienteId: 0, equipamentoId: 0, tecnicoId: undefined as number | undefined,
    prazoOrcamento: "", descricaoProblema: "", senhaDesbloqueio: "",
    checklistEstadoFisico: {} as Record<string, string>,
    checklistSintomas: {} as Record<string, string>,
    acessoriosEntregues: [] as string[],
  });
  const utils = trpc.useUtils();
  const { data: os = [], isLoading } = trpc.os.list.useQuery({ status: statusFilter === "all" ? undefined : statusFilter, search });
  const { data: clientes = [] } = trpc.clientes.list.useQuery({});
  const { data: equips = [] } = trpc.equipamentos.list.useQuery({});
  const create = trpc.os.create.useMutation({
    onSuccess: () => {
      toast.success("OS criada com sucesso!");
      setOpen(false);
      setStep(1);
      utils.os.list.invalidate();
      setForm({ clienteId: 0, equipamentoId: 0, tecnicoId: undefined, prazoOrcamento: "", descricaoProblema: "", senhaDesbloqueio: "", checklistEstadoFisico: {}, checklistSintomas: {}, acessoriosEntregues: [] });
    },
    onError: (e) => toast.error(e.message),
  });

  const clienteEquips = equips.filter(e => e.clienteId === form.clienteId);

  const toggleChecklist = (type: "ef" | "s", key: string, value: string) => {
    if (type === "ef") {
      setForm(f => ({ ...f, checklistEstadoFisico: { ...f.checklistEstadoFisico, [key]: f.checklistEstadoFisico[key] === value ? "" : value } }));
    } else {
      setForm(f => ({ ...f, checklistSintomas: { ...f.checklistSintomas, [key]: f.checklistSintomas[key] === value ? "" : value } }));
    }
  };

  return (
    <AppLayout title="Ordens de Serviço">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por número, cliente..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(OS_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) setStep(1); }}>
            <DialogTrigger asChild>
              <Button style={{ background: "#1B4F8A" }}><Plus className="w-4 h-4 mr-2" />Nova OS</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Ordem de Serviço — Etapa {step}/3</DialogTitle>
              </DialogHeader>
              {step === 1 && (
                <div className="space-y-3">
                  <div><Label>Cliente *</Label>
                    <Select value={String(form.clienteId)} onValueChange={v => setForm({...form, clienteId: Number(v), equipamentoId: 0})}>
                      <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                      <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Equipamento *</Label>
                    <Select value={String(form.equipamentoId)} onValueChange={v => setForm({...form, equipamentoId: Number(v)})} disabled={!form.clienteId}>
                      <SelectTrigger><SelectValue placeholder={form.clienteId ? "Selecione o equipamento" : "Selecione um cliente primeiro"} /></SelectTrigger>
                      <SelectContent>{clienteEquips.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.marca} {e.modelo}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Prazo do Orçamento</Label><Input type="date" value={form.prazoOrcamento} onChange={e => setForm({...form, prazoOrcamento: e.target.value})} /></div>
                  <div><Label>Senha de desbloqueio</Label><Input value={form.senhaDesbloqueio} onChange={e => setForm({...form, senhaDesbloqueio: e.target.value})} /></div>
                  <div><Label>Descrição do problema</Label><Textarea value={form.descricaoProblema} onChange={e => setForm({...form, descricaoProblema: e.target.value})} rows={3} /></div>
                  <Button className="w-full" style={{ background: "#1B4F8A" }} onClick={() => { if (!form.clienteId || !form.equipamentoId) { toast.error("Selecione cliente e equipamento"); return; } setStep(2); }}>Próximo: Checklist de Entrada</Button>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold mb-2">Estado Físico</p>
                    <div className="grid grid-cols-2 gap-2">
                      {CHECKLIST_ESTADO_FISICO.map(key => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-sm flex-1">{CHECKLIST_LABELS[key]}</span>
                          <div className="flex gap-1">
                            {["ok", "danificado", "ausente"].map(v => (
                              <button key={v} onClick={() => toggleChecklist("ef", key, v)}
                                className={`px-2 py-0.5 rounded text-xs border transition-colors ${form.checklistEstadoFisico[key] === v ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary"}`}>
                                {v === "ok" ? "OK" : v === "danificado" ? "Dan." : "Aus."}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold mb-2">Sintomas Relatados</p>
                    <div className="grid grid-cols-2 gap-2">
                      {CHECKLIST_SINTOMAS.map(key => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-sm flex-1">{CHECKLIST_LABELS[key]}</span>
                          <div className="flex gap-1">
                            {["normal", "com_falha", "sem_funcao"].map(v => (
                              <button key={v} onClick={() => toggleChecklist("s", key, v)}
                                className={`px-2 py-0.5 rounded text-xs border transition-colors ${form.checklistSintomas[key] === v ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary"}`}>
                                {v === "normal" ? "OK" : v === "com_falha" ? "Falha" : "Sem"}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Voltar</Button>
                    <Button style={{ background: "#1B4F8A" }} onClick={() => setStep(3)} className="flex-1">Próximo: Acessórios</Button>
                  </div>
                </div>
              )}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold mb-2">Acessórios entregues</p>
                    {["Carregador", "Cabo USB", "Capa protetora", "Película", "Fone de ouvido", "Bateria extra"].map(acc => (
                      <label key={acc} className="flex items-center gap-2 py-1 cursor-pointer">
                        <input type="checkbox" checked={form.acessoriosEntregues.includes(acc)}
                          onChange={e => setForm(f => ({ ...f, acessoriosEntregues: e.target.checked ? [...f.acessoriosEntregues, acc] : f.acessoriosEntregues.filter(a => a !== acc) }))} />
                        <span className="text-sm">{acc}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Voltar</Button>
                    <Button style={{ background: "#1B4F8A" }} onClick={() => create.mutate(form)} disabled={create.isPending} className="flex-1">
                      {create.isPending ? "Criando..." : "Criar OS"}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? <div className="text-center py-12 text-muted-foreground">Carregando...</div> :
          os.length === 0 ? <div className="text-center py-12 text-muted-foreground">Nenhuma OS encontrada.</div> :
          <div className="space-y-2">
            {os.map(o => {
              const isVencida = o.prazoOrcamento && new Date(o.prazoOrcamento) < new Date() && !["encerrado","cancelado","devolvido_sem_reparo"].includes(o.status);
              return (
                <Link key={o.id} href={`/ordens-servico/${o.id}`}>
                  <Card className={`cursor-pointer hover:shadow-md transition-shadow ${isVencida ? "border-destructive/50" : ""}`}>
                    <CardContent className="p-4 flex items-center gap-3">
                      {isVencida && <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-semibold text-sm">{o.numero}</span>
                          <Badge className={`text-xs ${OS_STATUS_COLORS[o.status] ?? "bg-gray-100 text-gray-700"}`}>
                            {OS_STATUS_LABELS[o.status] ?? o.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{o.clienteNome} — {o.equipamentoMarca} {o.equipamentoModelo}</p>
                        {o.prazoOrcamento && (
                          <p className={`text-xs flex items-center gap-1 mt-0.5 ${isVencida ? "text-destructive" : "text-muted-foreground"}`}>
                            <Clock className="w-3 h-3" />
                            Prazo: {new Date(o.prazoOrcamento).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {o.valorTotal && <p className="font-semibold text-sm">R$ {parseFloat(String(o.valorTotal)).toFixed(2)}</p>}
                        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        }
      </div>
    </AppLayout>
  );
}
