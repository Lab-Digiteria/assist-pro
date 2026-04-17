import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Star,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const BLANK_FORM = {
  tipo: "pf" as "pf" | "pj",
  nome: "",
  cpfCnpj: "",
  inscricaoEstadual: "",
  whatsapp: "",
  email: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  origemCliente: "" as any,
  preferenciaContato: "" as any,
  horarioPreferidoContato: "",
  classificacao: "padrao" as "padrao" | "vip" | "recorrente" | "inadimplente",
  observacoesInternas: "",
  aceitouTermos: false,
};

type FormValues = typeof BLANK_FORM;

const CLASSIFICACAO_COLORS: Record<string, string> = {
  padrao: "bg-gray-100 text-gray-700",
  vip: "bg-yellow-100 text-yellow-800",
  recorrente: "bg-blue-100 text-blue-800",
  inadimplente: "bg-red-100 text-red-800",
};

const CLASSIFICACAO_ICONS: Record<string, React.ReactNode> = {
  vip: <Star className="w-3 h-3" />,
  recorrente: <RefreshCw className="w-3 h-3" />,
  inadimplente: <AlertTriangle className="w-3 h-3" />,
};

// ─── ClienteForm definido FORA do componente pai para evitar remontagem ───────
function ClienteForm({
  values,
  onChange,
  onSubmit,
  isPending,
  submitLabel,
}: {
  values: FormValues;
  onChange: (v: FormValues) => void;
  onSubmit: () => void;
  isPending: boolean;
  submitLabel: string;
}) {
  return (
    <Tabs defaultValue="basico">
      <TabsList className="w-full mb-4">
        <TabsTrigger value="basico" className="flex-1">Dados Básicos</TabsTrigger>
        <TabsTrigger value="endereco" className="flex-1">Endereço</TabsTrigger>
        <TabsTrigger value="inteligente" className="flex-1">Perfil</TabsTrigger>
      </TabsList>

      <TabsContent value="basico" className="space-y-3">
        <div>
          <Label>Tipo</Label>
          <Select value={values.tipo} onValueChange={(v) => onChange({ ...values, tipo: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pf">Pessoa Física</SelectItem>
              <SelectItem value="pj">Pessoa Jurídica</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Nome {values.tipo === "pj" ? "/ Razão Social" : ""} *</Label>
          <Input value={values.nome} onChange={(e) => onChange({ ...values, nome: e.target.value })} />
        </div>
        <div>
          <Label>{values.tipo === "pj" ? "CNPJ" : "CPF"}</Label>
          <Input
            value={values.cpfCnpj}
            onChange={(e) => onChange({ ...values, cpfCnpj: e.target.value })}
            placeholder={values.tipo === "pj" ? "00.000.000/0001-00" : "000.000.000-00"}
          />
        </div>
        {values.tipo === "pj" && (
          <div>
            <Label>Inscrição Estadual</Label>
            <Input value={values.inscricaoEstadual} onChange={(e) => onChange({ ...values, inscricaoEstadual: e.target.value })} />
          </div>
        )}
        <div>
          <Label>WhatsApp</Label>
          <Input value={values.whatsapp} onChange={(e) => onChange({ ...values, whatsapp: e.target.value })} placeholder="(00) 00000-0000" />
        </div>
        <div>
          <Label>E-mail</Label>
          <Input type="email" value={values.email} onChange={(e) => onChange({ ...values, email: e.target.value })} />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id="termos"
            checked={values.aceitouTermos}
            onCheckedChange={(v) => onChange({ ...values, aceitouTermos: !!v })}
          />
          <Label htmlFor="termos" className="font-normal text-sm cursor-pointer">
            Cliente aceitou os termos de uso
          </Label>
        </div>
      </TabsContent>

      <TabsContent value="endereco" className="space-y-3">
        <div>
          <Label>CEP</Label>
          <Input value={values.cep} onChange={(e) => onChange({ ...values, cep: e.target.value })} placeholder="00000-000" />
        </div>
        <div>
          <Label>Logradouro</Label>
          <Input value={values.logradouro} onChange={(e) => onChange({ ...values, logradouro: e.target.value })} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1">
            <Label>Número</Label>
            <Input value={values.numero} onChange={(e) => onChange({ ...values, numero: e.target.value })} />
          </div>
          <div className="col-span-2">
            <Label>Complemento</Label>
            <Input value={values.complemento} onChange={(e) => onChange({ ...values, complemento: e.target.value })} />
          </div>
        </div>
        <div>
          <Label>Bairro</Label>
          <Input value={values.bairro} onChange={(e) => onChange({ ...values, bairro: e.target.value })} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <Label>Cidade</Label>
            <Input value={values.cidade} onChange={(e) => onChange({ ...values, cidade: e.target.value })} />
          </div>
          <div>
            <Label>UF</Label>
            <Input maxLength={2} value={values.estado} onChange={(e) => onChange({ ...values, estado: e.target.value.toUpperCase() })} />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="inteligente" className="space-y-3">
        <div>
          <Label>Origem do cliente</Label>
          <Select value={values.origemCliente || "_none"} onValueChange={(v) => onChange({ ...values, origemCliente: v === "_none" ? "" : v })}>
            <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Não informado</SelectItem>
              <SelectItem value="indicacao">Indicação</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="redes_sociais">Redes sociais</SelectItem>
              <SelectItem value="passante">Passante</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Preferência de contato</Label>
          <Select value={values.preferenciaContato || "_none"} onValueChange={(v) => onChange({ ...values, preferenciaContato: v === "_none" ? "" : v })}>
            <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Não informado</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="email">E-mail</SelectItem>
              <SelectItem value="ligacao">Ligação</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Horário preferido para contato</Label>
          <Input
            value={values.horarioPreferidoContato}
            onChange={(e) => onChange({ ...values, horarioPreferidoContato: e.target.value })}
            placeholder="Ex: manhã, 14h-18h..."
          />
        </div>
        <div>
          <Label>Classificação interna</Label>
          <Select value={values.classificacao} onValueChange={(v) => onChange({ ...values, classificacao: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="padrao">Padrão</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
              <SelectItem value="recorrente">Recorrente</SelectItem>
              <SelectItem value="inadimplente">Inadimplente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Observações internas <span className="text-xs text-muted-foreground">(não visível ao cliente)</span></Label>
          <Textarea
            value={values.observacoesInternas}
            onChange={(e) => onChange({ ...values, observacoesInternas: e.target.value })}
            rows={3}
            placeholder="Anotações internas sobre o cliente..."
          />
        </div>
      </TabsContent>

      <Button
        className="w-full mt-4"
        style={{ background: "#1B4F8A" }}
        onClick={onSubmit}
        disabled={isPending || !values.nome}
      >
        {isPending ? "Salvando..." : submitLabel}
      </Button>
    </Tabs>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Clientes() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [editForm, setEditForm] = useState<FormValues | null>(null);

  const utils = trpc.useUtils();
  const { data: clientes = [], isLoading } = trpc.clientes.list.useQuery({ search });
  const { data: selectedCliente } = trpc.clientes.get.useQuery(
    { id: selectedId! },
    { enabled: !!selectedId }
  );
  const { data: equipamentos = [] } = trpc.clientes.getEquipamentos.useQuery(
    { clienteId: selectedId! },
    { enabled: !!selectedId }
  );

  const create = trpc.clientes.create.useMutation({
    onSuccess: () => {
      toast.success("Cliente cadastrado!");
      setOpen(false);
      utils.clientes.list.invalidate();
      setForm(BLANK_FORM);
    },
    onError: (e) => toast.error(e.message),
  });

  const update = trpc.clientes.update.useMutation({
    onSuccess: () => {
      toast.success("Cliente atualizado!");
      utils.clientes.list.invalidate();
      utils.clientes.get.invalidate({ id: selectedId! });
      setEditForm(null);
    },
    onError: (e) => toast.error(e.message),
  });

  function handleCreate() {
    const payload = {
      ...form,
      origemCliente: form.origemCliente || undefined,
      preferenciaContato: form.preferenciaContato || undefined,
      horarioPreferidoContato: form.horarioPreferidoContato || undefined,
      observacoesInternas: form.observacoesInternas || undefined,
      email: form.email || undefined,
      cpfCnpj: form.cpfCnpj || undefined,
    };
    create.mutate(payload);
  }

  function handleUpdate() {
    if (!editForm || !selectedId) return;
    const payload = {
      id: selectedId,
      ...editForm,
      origemCliente: editForm.origemCliente || undefined,
      preferenciaContato: editForm.preferenciaContato || undefined,
      email: editForm.email || undefined,
      cpfCnpj: editForm.cpfCnpj || undefined,
    };
    update.mutate(payload);
  }

  function openDetail(id: number) {
    setSelectedId(id);
  }

  function startEdit() {
    if (!selectedCliente) return;
    setEditForm({
      tipo: selectedCliente.tipo,
      nome: selectedCliente.nome,
      cpfCnpj: selectedCliente.cpfCnpj ?? "",
      inscricaoEstadual: selectedCliente.inscricaoEstadual ?? "",
      whatsapp: selectedCliente.whatsapp ?? "",
      email: selectedCliente.email ?? "",
      cep: selectedCliente.cep ?? "",
      logradouro: selectedCliente.logradouro ?? "",
      numero: selectedCliente.numero ?? "",
      complemento: selectedCliente.complemento ?? "",
      bairro: selectedCliente.bairro ?? "",
      cidade: selectedCliente.cidade ?? "",
      estado: selectedCliente.estado ?? "",
      origemCliente: (selectedCliente as any).origemCliente ?? "",
      preferenciaContato: (selectedCliente as any).preferenciaContato ?? "",
      horarioPreferidoContato: (selectedCliente as any).horarioPreferidoContato ?? "",
      classificacao: (selectedCliente as any).classificacao ?? "padrao",
      observacoesInternas: (selectedCliente as any).observacoesInternas ?? "",
      aceitouTermos: (selectedCliente as any).aceitouTermos ?? false,
    });
  }

  return (
    <AppLayout title="Clientes">
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF/CNPJ ou WhatsApp..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button style={{ background: "#1B4F8A" }}>
                <Plus className="w-4 h-4 mr-2" />Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Cliente</DialogTitle>
              </DialogHeader>
              <ClienteForm
                values={form}
                onChange={setForm}
                onSubmit={handleCreate}
                isPending={create.isPending}
                submitLabel="Cadastrar"
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="data-table-container">
          {isLoading ? (
            <div className="space-y-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3" style={{ borderBottom: "1px solid var(--surface-border)" }}>
                  <div className="skeleton w-8 h-8 rounded-full" />
                  <div className="skeleton flex-1 h-4 rounded" />
                  <div className="skeleton w-28 h-4 rounded" />
                  <div className="skeleton w-20 h-4 rounded" />
                </div>
              ))}
            </div>
          ) : clientes.length === 0 ? (
            <div className="empty-state">
              <User size={36} style={{ color: "var(--text-muted)", marginBottom: 12 }} />
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Nenhum cliente encontrado</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Cadastre o primeiro cliente usando o botão acima</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>CPF / CNPJ</th>
                  <th>WhatsApp</th>
                  <th>Cidade</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => {
                  const classif = (c as any).classificacao ?? "padrao";
                  return (
                    <tr key={c.id} className="cursor-pointer" onClick={() => openDetail(c.id)}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: "rgba(27,79,138,0.2)" }}>
                            {c.tipo === "pj" ? (
                              <Building2 size={13} style={{ color: "#60a5fa" }} />
                            ) : (
                              <User size={13} style={{ color: "#60a5fa" }} />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{c.nome}</span>
                              {classif !== "padrao" && (
                                <Badge className={`text-xs px-1.5 py-0 flex items-center gap-1 ${CLASSIFICACAO_COLORS[classif]}`}>
                                  {CLASSIFICACAO_ICONS[classif]}
                                  {classif === "vip" ? "VIP" : classif === "recorrente" ? "Recorrente" : "Inadimplente"}
                                </Badge>
                              )}
                            </div>
                            {c.email && <div className="text-xs" style={{ color: "var(--text-muted)" }}>{c.email}</div>}
                          </div>
                        </div>
                      </td>
                      <td><span className="text-xs" style={{ color: "var(--text-muted)" }}>{c.cpfCnpj || "—"}</span></td>
                      <td>
                        {c.whatsapp ? (
                          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{c.whatsapp}</span>
                        ) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                      </td>
                      <td>
                        {c.cidade ? (
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{c.cidade}/{c.estado}</span>
                        ) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                      </td>
                      <td><ChevronRight size={14} style={{ color: "var(--text-muted)" }} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selectedId} onOpenChange={(o) => { if (!o) { setSelectedId(null); setEditForm(null); } }}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedCliente ? (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="flex items-center gap-2">
                  {selectedCliente.tipo === "pj" ? <Building2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  {selectedCliente.nome}
                </SheetTitle>
              </SheetHeader>

              {editForm ? (
                <div>
                  <ClienteForm
                    values={editForm}
                    onChange={setEditForm}
                    onSubmit={handleUpdate}
                    isPending={update.isPending}
                    submitLabel="Salvar alterações"
                  />
                  <Button variant="ghost" className="w-full mt-2" onClick={() => setEditForm(null)}>Cancelar</Button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">CPF/CNPJ</span><p className="font-medium">{selectedCliente.cpfCnpj || "—"}</p></div>
                    <div><span className="text-muted-foreground">WhatsApp</span><p className="font-medium">{selectedCliente.whatsapp || "—"}</p></div>
                    <div><span className="text-muted-foreground">E-mail</span><p className="font-medium">{selectedCliente.email || "—"}</p></div>
                    <div><span className="text-muted-foreground">Cidade</span><p className="font-medium">{selectedCliente.cidade ? `${selectedCliente.cidade}/${selectedCliente.estado}` : "—"}</p></div>
                    <div><span className="text-muted-foreground">Origem</span><p className="font-medium capitalize">{(selectedCliente as any).origemCliente?.replace("_", " ") || "—"}</p></div>
                    <div><span className="text-muted-foreground">Pref. contato</span><p className="font-medium capitalize">{(selectedCliente as any).preferenciaContato || "—"}</p></div>
                    <div><span className="text-muted-foreground">Horário preferido</span><p className="font-medium">{(selectedCliente as any).horarioPreferidoContato || "—"}</p></div>
                    <div><span className="text-muted-foreground">Classificação</span>
                      <Badge className={`text-xs mt-0.5 ${CLASSIFICACAO_COLORS[(selectedCliente as any).classificacao ?? "padrao"]}`}>
                        {(selectedCliente as any).classificacao ?? "padrão"}
                      </Badge>
                    </div>
                    <div><span className="text-muted-foreground">Termos aceitos</span><p className="font-medium">{(selectedCliente as any).aceitouTermos ? "Sim" : "Não"}</p></div>
                  </div>

                  {(selectedCliente as any).observacoesInternas && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                      <p className="font-medium text-yellow-800 mb-1">Observações internas</p>
                      <p className="text-yellow-700">{(selectedCliente as any).observacoesInternas}</p>
                    </div>
                  )}

                  {/* Equipamentos histórico */}
                  {equipamentos.length > 0 && (
                    <div>
                      <p className="font-semibold text-sm mb-2 flex items-center gap-1"><Wrench className="w-4 h-4" />Equipamentos atendidos ({equipamentos.length})</p>
                      <div className="space-y-2">
                        {equipamentos.map((eq) => (
                          <div key={eq.id} className="flex items-center gap-2 text-sm bg-muted/40 rounded-lg px-3 py-2">
                            <span className="font-medium">{eq.marca} {eq.modelo}</span>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-muted-foreground capitalize">{eq.categoria}</span>
                            {eq.imei && <span className="text-xs text-muted-foreground ml-auto">IMEI: {eq.imei}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button className="w-full" variant="outline" onClick={startEdit}>
                    Editar dados
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-muted-foreground">Carregando...</div>
          )}
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
