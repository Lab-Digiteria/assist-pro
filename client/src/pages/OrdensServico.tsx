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
import { Plus, Search, ChevronRight, Clock, AlertTriangle, UserPlus, Smartphone } from "lucide-react";
import { useState, useMemo } from "react";
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
const CATEGORIAS_EQUIP = [
  { value: "smartphone", label: "Smartphone" },
  { value: "tablet", label: "Tablet" },
  { value: "notebook", label: "Notebook" },
  { value: "desktop", label: "Desktop" },
  { value: "smartwatch", label: "Smartwatch" },
  { value: "console", label: "Console" },
  { value: "tv", label: "TV" },
  { value: "outro", label: "Outro" },
];

// ── Modal: Novo Cliente ───────────────────────────────────────────────────────
function NovoClienteModal({ onCreated }: { onCreated: (id: number, nome: string) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", whatsapp: "", email: "" });
  const utils = trpc.useUtils();
  const create = trpc.clientes.create.useMutation({
    onSuccess: (data) => {
      if (data) {
        toast.success(`Cliente "${data.nome}" criado`);
        utils.clientes.list.invalidate();
        onCreated(data.id, data.nome);
        setOpen(false);
        setForm({ nome: "", whatsapp: "", email: "" });
      }
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1 text-xs h-8">
          <UserPlus className="w-3 h-3" /> Novo cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome *</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome completo" /></div>
          <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="(11) 99999-9999" /></div>
          <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="cliente@email.com" /></div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button className="flex-1" style={{ background: "#1B4F8A" }}
              disabled={!form.nome.trim() || create.isPending}
              onClick={() => create.mutate({ nome: form.nome, whatsapp: form.whatsapp || undefined, email: form.email || undefined, tipo: "pf", aceitouTermos: false })}>
              {create.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Modal: Novo Equipamento ───────────────────────────────────────────────────
function NovoEquipamentoModal({ clienteId, onCreated }: { clienteId: number; onCreated: (id: number, label: string) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ categoria: "smartphone", marca: "", modelo: "", numeroSerie: "", imei: "", cor: "" });
  const utils = trpc.useUtils();
  const create = trpc.equipamentos.create.useMutation({
    onSuccess: (data) => {
      if (data) {
        const label = `${data.marca} ${data.modelo}`;
        toast.success(`Equipamento "${label}" criado`);
        utils.equipamentos.list.invalidate();
        onCreated(data.id, label);
        setOpen(false);
        setForm({ categoria: "smartphone", marca: "", modelo: "", numeroSerie: "", imei: "", cor: "" });
      }
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1 text-xs h-8" disabled={!clienteId}>
          <Smartphone className="w-3 h-3" /> Novo equipamento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Novo Equipamento</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Tipo *</Label>
            <Select value={form.categoria} onValueChange={v => setForm(f => ({ ...f, categoria: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIAS_EQUIP.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Marca *</Label><Input value={form.marca} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} placeholder="Apple, Samsung..." /></div>
            <div><Label>Modelo *</Label><Input value={form.modelo} onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))} placeholder="iPhone 14, A54..." /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Cor</Label><Input value={form.cor} onChange={e => setForm(f => ({ ...f, cor: e.target.value }))} placeholder="Preto, Branco..." /></div>
            <div><Label>Série / IMEI</Label><Input value={form.imei || form.numeroSerie} onChange={e => {
              const v = e.target.value;
              if (/^\d+$/.test(v) && v.length <= 15) setForm(f => ({ ...f, imei: v, numeroSerie: "" }));
              else setForm(f => ({ ...f, numeroSerie: v, imei: "" }));
            }} placeholder="IMEI ou nº série" /></div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button className="flex-1" style={{ background: "#1B4F8A" }}
              disabled={!form.marca.trim() || !form.modelo.trim() || create.isPending}
              onClick={() => create.mutate({ clienteId, categoria: form.categoria as any, marca: form.marca, modelo: form.modelo, cor: form.cor || undefined, imei: form.imei || undefined, numeroSerie: form.numeroSerie || undefined })}>
              {create.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Formulário principal de Nova OS ──────────────────────────────────────────
export default function OrdensServico() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [clienteSearch, setClienteSearch] = useState("");
  const [form, setForm] = useState({
    clienteId: 0, clienteNome: "",
    equipamentoId: 0, equipamentoLabel: "",
    tecnicoId: undefined as number | undefined,
    attendantId: undefined as number | undefined,
    prazoOrcamento: "", descricaoProblema: "", senhaDesbloqueio: "",
    checklistEstadoFisico: {} as Record<string, string>,
    checklistSintomas: {} as Record<string, string>,
    acessoriosEntregues: [] as string[],
  });

  const utils = trpc.useUtils();
  const { data: osList = [], isLoading } = trpc.os.list.useQuery({ status: statusFilter === "all" ? undefined : statusFilter, search });
  const { data: clientes = [] } = trpc.clientes.list.useQuery({});
  const { data: equips = [] } = trpc.equipamentos.list.useQuery({});
  const { data: employees = [] } = trpc.employees.list.useQuery({ isActive: true });

  const create = trpc.os.create.useMutation({
    onSuccess: () => {
      toast.success("OS criada com sucesso!");
      setOpen(false);
      setStep(1);
      utils.os.list.invalidate();
      setForm({ clienteId: 0, clienteNome: "", equipamentoId: 0, equipamentoLabel: "", tecnicoId: undefined, attendantId: undefined, prazoOrcamento: "", descricaoProblema: "", senhaDesbloqueio: "", checklistEstadoFisico: {}, checklistSintomas: {}, acessoriosEntregues: [] });
      setClienteSearch("");
    },
    onError: (e) => toast.error(e.message),
  });

  const clientesFiltrados = useMemo(() => {
    if (!clienteSearch.trim()) return clientes.slice(0, 8);
    const q = clienteSearch.toLowerCase();
    return clientes.filter(c =>
      c.nome.toLowerCase().includes(q) ||
      (c.whatsapp ?? "").includes(q) ||
      (c.cpfCnpj ?? "").includes(q)
    ).slice(0, 8);
  }, [clientes, clienteSearch]);

  const clienteEquips = equips.filter(e => e.clienteId === form.clienteId);

  const toggleChecklist = (type: "ef" | "s", key: string, value: string) => {
    if (type === "ef") {
      setForm(f => ({ ...f, checklistEstadoFisico: { ...f.checklistEstadoFisico, [key]: f.checklistEstadoFisico[key] === value ? "" : value } }));
    } else {
      setForm(f => ({ ...f, checklistSintomas: { ...f.checklistSintomas, [key]: f.checklistSintomas[key] === value ? "" : value } }));
    }
  };

  const resetAndClose = () => { setOpen(false); setStep(1); setClienteSearch(""); };

  return (
    <AppLayout title="Ordens de Serviço">
      <div className="space-y-4">
        {/* Barra de filtros */}
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

          {/* Botão + Dialog Nova OS */}
          <Dialog open={open} onOpenChange={v => { if (!v) resetAndClose(); else setOpen(true); }}>
            <DialogTrigger asChild>
              <Button style={{ background: "#1B4F8A" }}><Plus className="w-4 h-4 mr-2" />Nova OS</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Ordem de Serviço — Etapa {step}/3</DialogTitle>
              </DialogHeader>

              {/* ── Etapa 1: Cliente + Equipamento ── */}
              {step === 1 && (
                <div className="space-y-4">
                  {/* Cliente */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label>Cliente *</Label>
                      <NovoClienteModal onCreated={(id, nome) => {
                        setForm(f => ({ ...f, clienteId: id, clienteNome: nome, equipamentoId: 0, equipamentoLabel: "" }));
                        setClienteSearch(nome);
                      }} />
                    </div>
                    {form.clienteId ? (
                      <div className="flex items-center gap-2 p-2 rounded-md border bg-muted/30">
                        <span className="flex-1 text-sm font-medium">{form.clienteNome}</span>
                        <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setForm(f => ({ ...f, clienteId: 0, clienteNome: "", equipamentoId: 0, equipamentoLabel: "" }))}>Trocar</button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Input
                          placeholder="Buscar por nome, telefone ou CPF..."
                          value={clienteSearch}
                          onChange={e => setClienteSearch(e.target.value)}
                          autoFocus
                        />
                        {clienteSearch.trim() && clientesFiltrados.length > 0 && (
                          <div className="border rounded-md overflow-hidden shadow-sm">
                            {clientesFiltrados.map(c => (
                              <button key={c.id} className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors border-b last:border-0"
                                onClick={() => { setForm(f => ({ ...f, clienteId: c.id, clienteNome: c.nome, equipamentoId: 0, equipamentoLabel: "" })); setClienteSearch(c.nome); }}>
                                <span className="font-medium">{c.nome}</span>
                                {c.whatsapp && <span className="text-muted-foreground ml-2 text-xs">{c.whatsapp}</span>}
                              </button>
                            ))}
                          </div>
                        )}
                        {clienteSearch.trim() && clientesFiltrados.length === 0 && (
                          <p className="text-xs text-muted-foreground px-1">Nenhum cliente encontrado. Use o botão "Novo cliente" acima.</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Equipamento */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label>Equipamento *</Label>
                      <NovoEquipamentoModal clienteId={form.clienteId} onCreated={(id, label) => {
                        setForm(f => ({ ...f, equipamentoId: id, equipamentoLabel: label }));
                      }} />
                    </div>
                    {form.equipamentoId ? (
                      <div className="flex items-center gap-2 p-2 rounded-md border bg-muted/30">
                        <span className="flex-1 text-sm font-medium">{form.equipamentoLabel}</span>
                        <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setForm(f => ({ ...f, equipamentoId: 0, equipamentoLabel: "" }))}>Trocar</button>
                      </div>
                    ) : (
                      <Select value={form.equipamentoId ? String(form.equipamentoId) : ""} onValueChange={v => {
                        const eq = clienteEquips.find(e => e.id === Number(v));
                        setForm(f => ({ ...f, equipamentoId: Number(v), equipamentoLabel: eq ? `${eq.marca} ${eq.modelo}` : "" }));
                      }} disabled={!form.clienteId}>
                        <SelectTrigger>
                          <SelectValue placeholder={form.clienteId ? (clienteEquips.length ? "Selecione o equipamento" : "Nenhum equipamento — use o botão acima") : "Selecione um cliente primeiro"} />
                        </SelectTrigger>
                        <SelectContent>
                          {clienteEquips.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.marca} {e.modelo}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Campos extras */}
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Prazo do Orçamento</Label><Input type="date" value={form.prazoOrcamento} onChange={e => setForm(f => ({ ...f, prazoOrcamento: e.target.value }))} /></div>
                    <div><Label>Senha de desbloqueio</Label><Input value={form.senhaDesbloqueio} onChange={e => setForm(f => ({ ...f, senhaDesbloqueio: e.target.value }))} /></div>
                  </div>
                  <div><Label>Descrição do problema</Label><Textarea value={form.descricaoProblema} onChange={e => setForm(f => ({ ...f, descricaoProblema: e.target.value }))} rows={3} /></div>

                  <Button className="w-full" style={{ background: "#1B4F8A" }} onClick={() => {
                    if (!form.clienteId || !form.equipamentoId) { toast.error("Selecione cliente e equipamento"); return; }
                    setStep(2);
                  }}>Próximo: Checklist de Entrada</Button>
                </div>
              )}

              {/* ── Etapa 2: Checklist ── */}
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

              {/* ── Etapa 3: Acessórios ── */}
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
                  {/* Técnico e Atendente */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Técnico Responsável</Label>
                      <Select value={form.tecnicoId?.toString() ?? ""} onValueChange={v => setForm(f => ({ ...f, tecnicoId: v ? parseInt(v) : undefined }))}>
                        <SelectTrigger><SelectValue placeholder="Selecionar técnico" /></SelectTrigger>
                        <SelectContent>
                          {employees.filter(e => ["technician","manager","admin"].includes(e.role)).map(e => (
                            <SelectItem key={e.id} value={e.id.toString()}>{e.fullName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Atendente</Label>
                      <Select value={form.attendantId?.toString() ?? ""} onValueChange={v => setForm(f => ({ ...f, attendantId: v ? parseInt(v) : undefined }))}>
                        <SelectTrigger><SelectValue placeholder="Selecionar atendente" /></SelectTrigger>
                        <SelectContent>
                          {employees.filter(e => ["attendant","manager","admin"].includes(e.role)).map(e => (
                            <SelectItem key={e.id} value={e.id.toString()}>{e.fullName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Voltar</Button>
                    <Button style={{ background: "#1B4F8A" }} onClick={() => create.mutate({
                      clienteId: form.clienteId,
                      equipamentoId: form.equipamentoId,
                      tecnicoId: form.tecnicoId,
                      attendantId: form.attendantId,
                      prazoOrcamento: form.prazoOrcamento || undefined,
                      descricaoProblema: form.descricaoProblema || undefined,
                      senhaDesbloqueio: form.senhaDesbloqueio || undefined,
                      checklistEstadoFisico: form.checklistEstadoFisico,
                      checklistSintomas: form.checklistSintomas,
                      acessoriosEntregues: form.acessoriosEntregues,
                    })} disabled={create.isPending} className="flex-1">
                      {create.isPending ? "Criando..." : "Criar OS"}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de OS */}
        {isLoading ? <div className="text-center py-12 text-muted-foreground">Carregando...</div> :
          osList.length === 0 ? <div className="text-center py-12 text-muted-foreground">Nenhuma OS encontrada.</div> :
          <div className="space-y-2">
            {osList.map(o => {
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
