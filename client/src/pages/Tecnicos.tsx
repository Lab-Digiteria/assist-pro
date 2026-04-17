import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useState, useRef } from "react";
import {
  Plus, Search, UserCheck, UserX, Pencil, Trash2, Upload,
  Percent, DollarSign, Users
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  technician: "Técnico",
  attendant: "Atendente",
  manager: "Gerente",
  admin: "Administrador",
};
const ROLE_COLORS: Record<string, string> = {
  technician: "bg-blue-100 text-blue-700",
  attendant: "bg-green-100 text-green-700",
  manager: "bg-purple-100 text-purple-700",
  admin: "bg-red-100 text-red-700",
};

const SPECIALTIES_OPTIONS = ["Smartphones", "Notebooks", "Tablets", "Videogames", "TVs", "Áudio", "Câmeras", "Outros"];

function applyMask(value: string, mask: string) {
  let v = value.replace(/\D/g, "");
  let result = "";
  let vi = 0;
  for (let i = 0; i < mask.length && vi < v.length; i++) {
    if (mask[i] === "#") { result += v[vi++]; } else { result += mask[i]; }
  }
  return result;
}
const cpfMask = (v: string) => applyMask(v, "###.###.###-##");
const phoneMask = (v: string) => v.replace(/\D/g, "").length <= 10 ? applyMask(v, "(##) ####-####") : applyMask(v, "(##) #####-####");

const BLANK_FORM = {
  fullName: "", cpf: "", rg: "", birthDate: "", phone: "", email: "", address: "",
  role: "technician" as const,
  specialties: [] as string[],
  hireDate: "",
  isActive: true,
  commissionType: "none" as "none" | "percentage" | "fixed",
  commissionPercentage: "",
  commissionFixedValue: "",
  commissionBase: "services_only" as "services_only" | "services_and_parts" | "total",
};

function EmployeeForm({ initial, onSave, isPending }: {
  initial: typeof BLANK_FORM;
  onSave: (data: typeof BLANK_FORM) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState(initial);
  const f = (patch: Partial<typeof BLANK_FORM>) => setForm(p => ({ ...p, ...patch }));

  const toggleSpecialty = (s: string) => {
    setForm(p => ({
      ...p,
      specialties: p.specialties.includes(s) ? p.specialties.filter(x => x !== s) : [...p.specialties, s],
    }));
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      {/* Dados pessoais */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Dados Pessoais</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Nome Completo *</Label>
            <Input value={form.fullName} onChange={e => f({ fullName: e.target.value })} placeholder="Nome do colaborador" />
          </div>
          <div>
            <Label>CPF</Label>
            <Input value={form.cpf} onChange={e => f({ cpf: cpfMask(e.target.value) })} placeholder="000.000.000-00" maxLength={14} />
          </div>
          <div>
            <Label>RG</Label>
            <Input value={form.rg} onChange={e => f({ rg: e.target.value })} placeholder="00.000.000-0" />
          </div>
          <div>
            <Label>Data de Nascimento</Label>
            <Input type="date" value={form.birthDate} onChange={e => f({ birthDate: e.target.value })} />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input value={form.phone} onChange={e => f({ phone: phoneMask(e.target.value) })} placeholder="(11) 99999-9999" maxLength={15} />
          </div>
          <div className="col-span-2">
            <Label>E-mail</Label>
            <Input type="email" value={form.email} onChange={e => f({ email: e.target.value })} placeholder="colaborador@empresa.com" />
          </div>
          <div className="col-span-2">
            <Label>Endereço</Label>
            <Input value={form.address} onChange={e => f({ address: e.target.value })} placeholder="Rua, número, bairro, cidade" />
          </div>
        </div>
      </div>

      <Separator />

      {/* Dados profissionais */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Dados Profissionais</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Função</Label>
            <Select value={form.role} onValueChange={v => f({ role: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Data de Admissão</Label>
            <Input type="date" value={form.hireDate} onChange={e => f({ hireDate: e.target.value })} />
          </div>
          <div className="col-span-2">
            <Label>Especialidades</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {SPECIALTIES_OPTIONS.map(s => (
                <button key={s} type="button" onClick={() => toggleSpecialty(s)}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${form.specialties.includes(s) ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Comissão */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Comissão</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Tipo de Comissão</Label>
            <Select value={form.commissionType} onValueChange={v => f({ commissionType: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem comissão</SelectItem>
                <SelectItem value="percentage">Percentual sobre serviços</SelectItem>
                <SelectItem value="fixed">Valor fixo por OS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.commissionType === "percentage" && (
            <>
              <div>
                <Label>Percentual (%)</Label>
                <Input type="number" min={0} max={100} step={0.5} value={form.commissionPercentage}
                  onChange={e => f({ commissionPercentage: e.target.value })} placeholder="Ex: 10" />
              </div>
              <div>
                <Label>Base de Cálculo</Label>
                <Select value={form.commissionBase} onValueChange={v => f({ commissionBase: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="services_only">Apenas serviços</SelectItem>
                    <SelectItem value="services_and_parts">Serviços + peças</SelectItem>
                    <SelectItem value="total">Total da OS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          {form.commissionType === "fixed" && (
            <div>
              <Label>Valor Fixo por OS (R$)</Label>
              <Input type="number" min={0} step={0.01} value={form.commissionFixedValue}
                onChange={e => f({ commissionFixedValue: e.target.value })} placeholder="Ex: 50.00" />
            </div>
          )}
        </div>
      </div>

      <Button className="w-full" style={{ background: "#1B4F8A" }} onClick={() => onSave(form)} disabled={isPending || !form.fullName.trim()}>
        {isPending ? "Salvando..." : "Salvar Colaborador"}
      </Button>
    </div>
  );
}

export default function Tecnicos() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [openNew, setOpenNew] = useState(false);
  const [editEmployee, setEditEmployee] = useState<any | null>(null);

  const { data: employees = [], isLoading } = trpc.employees.list.useQuery({});

  const create = trpc.employees.create.useMutation({
    onSuccess: () => { toast.success("Colaborador cadastrado!"); setOpenNew(false); utils.employees.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const update = trpc.employees.update.useMutation({
    onSuccess: () => { toast.success("Colaborador atualizado!"); setEditEmployee(null); utils.employees.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const toggleActive = trpc.employees.toggleActive.useMutation({
    onSuccess: (d) => { toast.success(d.isActive ? "Colaborador ativado!" : "Colaborador desativado!"); utils.employees.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const del = trpc.employees.delete.useMutation({
    onSuccess: () => { toast.success("Colaborador removido!"); utils.employees.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = employees.filter(e => {
    const matchSearch = !search || e.fullName.toLowerCase().includes(search.toLowerCase()) || (e.email ?? "").toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || e.role === filterRole;
    return matchSearch && matchRole;
  });

  const toFormData = (emp: any): typeof BLANK_FORM => ({
    fullName: emp.fullName ?? "",
    cpf: emp.cpf ?? "",
    rg: emp.rg ?? "",
    birthDate: emp.birthDate ?? "",
    phone: emp.phone ?? "",
    email: emp.email ?? "",
    address: emp.address ?? "",
    role: emp.role ?? "technician",
    specialties: (emp.specialties as string[]) ?? [],
    hireDate: emp.hireDate ?? "",
    isActive: emp.isActive ?? true,
    commissionType: emp.commissionType ?? "none",
    commissionPercentage: emp.commissionPercentage ?? "",
    commissionFixedValue: emp.commissionFixedValue ?? "",
    commissionBase: emp.commissionBase ?? "services_only",
  });

  return (
    <AppLayout title="Técnicos e Colaboradores">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-2 flex-1 min-w-0">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar por nome ou e-mail..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as funções</SelectItem>
                {Object.entries(ROLE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button style={{ background: "#1B4F8A" }}>
                <Plus className="w-4 h-4 mr-2" />Novo Colaborador
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Novo Colaborador</DialogTitle></DialogHeader>
              <EmployeeForm
                initial={BLANK_FORM}
                onSave={(data) => create.mutate({
                  ...data,
                  commissionPercentage: data.commissionPercentage || undefined,
                  commissionFixedValue: data.commissionFixedValue || undefined,
                })}
                isPending={create.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhum colaborador encontrado.</p>
            <p className="text-sm mt-1">Cadastre técnicos e atendentes para vinculá-los às OS.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((emp) => (
              <Card key={emp.id} className={emp.isActive ? "" : "opacity-60"}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">
                      {emp.photoUrl ? (
                        <img src={emp.photoUrl} alt={emp.fullName} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        emp.fullName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{emp.fullName}</p>
                        <Badge className={`text-xs ${ROLE_COLORS[emp.role]}`}>{ROLE_LABELS[emp.role]}</Badge>
                        {!emp.isActive && <Badge variant="outline" className="text-xs text-muted-foreground">Inativo</Badge>}
                      </div>
                      <div className="flex gap-3 mt-0.5 text-sm text-muted-foreground flex-wrap">
                        {emp.phone && <span>{emp.phone}</span>}
                        {emp.email && <span>{emp.email}</span>}
                        {emp.hireDate && <span>Desde {new Date(emp.hireDate + "T00:00:00").toLocaleDateString("pt-BR")}</span>}
                      </div>
                      {Array.isArray(emp.specialties) && emp.specialties.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {(emp.specialties as string[]).map(s => (
                            <span key={s} className="text-xs bg-muted px-1.5 py-0.5 rounded">{s}</span>
                          ))}
                        </div>
                      )}
                      {emp.commissionType !== "none" && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-orange-700">
                          {emp.commissionType === "percentage" ? <Percent className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
                          {emp.commissionType === "percentage"
                            ? `${emp.commissionPercentage}% sobre ${emp.commissionBase === "services_only" ? "serviços" : emp.commissionBase === "services_and_parts" ? "serv+peças" : "total"}`
                            : `R$ ${emp.commissionFixedValue} por OS`}
                        </div>
                      )}
                    </div>
                    {/* Ações */}
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => setEditEmployee(emp)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleActive.mutate({ id: emp.id })} disabled={toggleActive.isPending}>
                        {emp.isActive ? <UserX className="w-3.5 h-3.5 text-amber-600" /> : <UserCheck className="w-3.5 h-3.5 text-green-600" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { if (confirm("Remover colaborador?")) del.mutate({ id: emp.id }); }} disabled={del.isPending}>
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        {editEmployee && (
          <Dialog open={!!editEmployee} onOpenChange={() => setEditEmployee(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Editar Colaborador</DialogTitle></DialogHeader>
              <EmployeeForm
                initial={toFormData(editEmployee)}
                onSave={(data) => update.mutate({
                  id: editEmployee.id,
                  ...data,
                  commissionPercentage: data.commissionPercentage || undefined,
                  commissionFixedValue: data.commissionFixedValue || undefined,
                })}
                isPending={update.isPending}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AppLayout>
  );
}
