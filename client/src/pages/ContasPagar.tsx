import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, CheckCircle2, XCircle, AlertCircle, Clock, TrendingDown, RefreshCw } from "lucide-react";

function fmt(v: number | string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
}
function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}
function isOverdue(dueDate: string, status: string) {
  return status === "pending" && new Date(dueDate + "T00:00:00") < new Date(new Date().toDateString());
}

const STATUS_CONFIG = {
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  paid: { label: "Pago", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  overdue: { label: "Vencido", color: "bg-red-100 text-red-800", icon: AlertCircle },
  cancelled: { label: "Cancelado", color: "bg-gray-100 text-gray-600", icon: XCircle },
};

const PAYMENT_METHODS = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "debito", label: "Débito" },
  { value: "credito", label: "Crédito" },
  { value: "boleto", label: "Boleto" },
  { value: "outros", label: "Outros" },
];

const RECURRENCE_FREQS = [
  { value: "monthly", label: "Mensal" },
  { value: "weekly", label: "Semanal" },
  { value: "yearly", label: "Anual" },
];

export default function ContasPagar() {
  const utils = trpc.useUtils();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterRecurring, setFilterRecurring] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showPay, setShowPay] = useState<number | null>(null);

  const { data: accounts = [] } = trpc.financeiroV2.bankAccounts.list.useQuery();
  const { data: chartAccounts = [] } = trpc.financeiroV2.chartOfAccounts.list.useQuery();
  const { data: items = [], isLoading } = trpc.financeiroV2.payables.list.useQuery(
    filterStatus !== "all" ? { status: filterStatus as any } : undefined
  );

  const [form, setForm] = useState({
    description: "", amount: "", dueDate: "", paymentMethod: "",
    bankAccountId: "", chartOfAccountId: "", supplierName: "", documentNumber: "",
    isRecurring: false, recurrenceFreq: "monthly", recurrenceEndDate: "", notes: "",
  });
  const [payForm, setPayForm] = useState({
    paidDate: new Date().toISOString().slice(0, 10),
    paymentMethod: "", bankAccountId: "",
  });

  const createMutation = trpc.financeiroV2.payables.create.useMutation({
    onSuccess: () => {
      utils.financeiroV2.payables.list.invalidate();
      utils.financeiroV2.dashboardFinanceiro.invalidate();
      setShowCreate(false);
      setForm({ description: "", amount: "", dueDate: "", paymentMethod: "", bankAccountId: "", chartOfAccountId: "", supplierName: "", documentNumber: "", isRecurring: false, recurrenceFreq: "monthly", recurrenceEndDate: "", notes: "" });
      toast.success("Conta a pagar criada!");
    },
    onError: (e) => toast.error(e.message),
  });

  const payMutation = trpc.financeiroV2.payables.pay.useMutation({
    onSuccess: () => {
      utils.financeiroV2.payables.list.invalidate();
      utils.financeiroV2.dashboardFinanceiro.invalidate();
      utils.financeiroV2.bankAccounts.list.invalidate();
      setShowPay(null);
      toast.success("Pagamento registrado!");
    },
    onError: (e) => toast.error(e.message),
  });

  const cancelMutation = trpc.financeiroV2.payables.cancel.useMutation({
    onSuccess: () => {
      utils.financeiroV2.payables.list.invalidate();
      toast.success("Conta cancelada.");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = () => {
    if (!form.description || !form.amount || !form.dueDate) return;
    createMutation.mutate({
      description: form.description,
      amount: parseFloat(form.amount),
      dueDate: form.dueDate,
      paymentMethod: form.paymentMethod as any || undefined,
      bankAccountId: form.bankAccountId ? parseInt(form.bankAccountId) : undefined,
      chartOfAccountId: form.chartOfAccountId ? parseInt(form.chartOfAccountId) : undefined,
      supplierName: form.supplierName || undefined,
      documentNumber: form.documentNumber || undefined,
      isRecurring: form.isRecurring,
      recurrenceConfig: form.isRecurring ? {
        frequency: form.recurrenceFreq as any,
        endDate: form.recurrenceEndDate || undefined,
      } : undefined,
      notes: form.notes || undefined,
    });
  };

  const handlePay = () => {
    if (!showPay || !payForm.paidDate) return;
    payMutation.mutate({
      id: showPay,
      paidDate: payForm.paidDate,
      paymentMethod: payForm.paymentMethod as any || undefined,
      bankAccountId: payForm.bankAccountId ? parseInt(payForm.bankAccountId) : undefined,
    });
  };

  const filteredItems = useMemo(() => {
    let list = items;
    if (filterRecurring === "recurring") list = list.filter(i => i.isRecurring);
    if (filterRecurring === "single") list = list.filter(i => !i.isRecurring);
    return list;
  }, [items, filterRecurring]);

  const totals = useMemo(() => ({
    pending: filteredItems.filter(i => i.status === "pending").reduce((s, i) => s + parseFloat(i.amount), 0),
    paid: filteredItems.filter(i => i.status === "paid").reduce((s, i) => s + parseFloat(i.amount), 0),
  }), [filteredItems]);

  const expenseAccounts = chartAccounts.filter(a => (a.type === "custo" || a.type === "despesa") && a.isActive);

  return (
    <AppLayout title="Contas a Pagar">
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Contas a Pagar</h1>
            <p className="text-muted-foreground text-sm">Gerencie seus pagamentos e contas fixas</p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" /> Novo Lançamento
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">A Pagar</p>
              <p className="text-2xl font-bold text-red-600">{fmt(totals.pending)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Pago</p>
              <p className="text-2xl font-bold text-green-600">{fmt(totals.paid)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          {[
            { value: "all", label: "Todos" },
            { value: "pending", label: "Pendentes" },
            { value: "paid", label: "Pagos" },
            { value: "cancelled", label: "Cancelados" },
          ].map(f => (
            <Button
              key={f.value}
              variant={filterStatus === f.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(f.value)}
            >
              {f.label}
            </Button>
          ))}
          <div className="ml-auto flex gap-2">
            {[
              { value: "all", label: "Todos" },
              { value: "recurring", label: "Fixas" },
              { value: "single", label: "Avulsas" },
            ].map(f => (
              <Button
                key={f.value}
                variant={filterRecurring === f.value ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilterRecurring(f.value)}
              >
                {f.value === "recurring" && <RefreshCw className="h-3 w-3 mr-1" />}
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Tabela */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <TrendingDown className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhum lançamento encontrado</p>
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-2" /> Criar primeiro lançamento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Descrição</th>
                      <th className="text-left p-3 font-medium">Vencimento</th>
                      <th className="text-left p-3 font-medium">Fornecedor</th>
                      <th className="text-right p-3 font-medium">Valor</th>
                      <th className="text-center p-3 font-medium">Status</th>
                      <th className="text-center p-3 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map(item => {
                      const overdue = isOverdue(item.dueDate, item.status);
                      const statusKey = overdue ? "overdue" : item.status as keyof typeof STATUS_CONFIG;
                      const cfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.pending;
                      const Icon = cfg.icon;
                      return (
                        <tr key={item.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {item.isRecurring && <RefreshCw className="h-3 w-3 text-blue-500 shrink-0" aria-label="Recorrente" />}
                              <p className="font-medium">{item.description}</p>
                            </div>
                            {item.documentNumber && <p className="text-xs text-muted-foreground">Doc: {item.documentNumber}</p>}
                          </td>
                          <td className="p-3 text-muted-foreground">{fmtDate(item.dueDate)}</td>
                          <td className="p-3 text-muted-foreground">{item.supplierName ?? "—"}</td>
                          <td className="p-3 text-right font-semibold text-red-700">{fmt(item.amount)}</td>
                          <td className="p-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                              <Icon className="h-3 w-3" />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex gap-1 justify-center">
                              {item.status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 border-green-200 hover:bg-green-50"
                                  onClick={() => {
                                    setShowPay(item.id);
                                    setPayForm({ paidDate: new Date().toISOString().slice(0, 10), paymentMethod: "", bankAccountId: "" });
                                  }}
                                >
                                  Pagar
                                </Button>
                              )}
                              {item.status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-500"
                                  onClick={() => { if (confirm("Cancelar este lançamento?")) cancelMutation.mutate({ id: item.id }); }}
                                >
                                  Cancelar
                                </Button>
                              )}
                            </div>
                          </td>
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

      {/* Modal Novo Lançamento */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Lançamento a Pagar</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <Label>Descrição *</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Aluguel, Energia, Fornecedor..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor (R$) *</Label>
                <Input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0,00" />
              </div>
              <div>
                <Label>Vencimento *</Label>
                <Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fornecedor</Label>
                <Input value={form.supplierName} onChange={e => setForm(f => ({ ...f, supplierName: e.target.value }))} placeholder="Nome do fornecedor" />
              </div>
              <div>
                <Label>Nº Documento</Label>
                <Input value={form.documentNumber} onChange={e => setForm(f => ({ ...f, documentNumber: e.target.value }))} placeholder="NF, boleto..." />
              </div>
            </div>
            <div>
              <Label>Categoria (Plano de Contas)</Label>
              <Select value={form.chartOfAccountId} onValueChange={v => setForm(f => ({ ...f, chartOfAccountId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {expenseAccounts.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.code} — {a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Conta Bancária</Label>
              <Select value={form.bankAccountId} onValueChange={v => setForm(f => ({ ...f, bankAccountId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {accounts.filter(a => a.isActive).map(a => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Recorrência */}
            <div className="border rounded-lg p-3 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={form.isRecurring}
                  onChange={e => setForm(f => ({ ...f, isRecurring: e.target.checked }))}
                  className="h-4 w-4"
                />
                <Label htmlFor="isRecurring" className="cursor-pointer flex items-center gap-1">
                  <RefreshCw className="h-4 w-4 text-blue-500" /> Conta Fixa / Recorrente
                </Label>
              </div>
              {form.isRecurring && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Frequência</Label>
                    <Select value={form.recurrenceFreq} onValueChange={v => setForm(f => ({ ...f, recurrenceFreq: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {RECURRENCE_FREQS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Data Final (opcional)</Label>
                    <Input type="date" value={form.recurrenceEndDate} onChange={e => setForm(f => ({ ...f, recurrenceEndDate: e.target.value }))} />
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label>Observações</Label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Opcional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Pagar */}
      <Dialog open={showPay !== null} onOpenChange={() => setShowPay(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Data do Pagamento *</Label>
              <Input type="date" value={payForm.paidDate} onChange={e => setPayForm(f => ({ ...f, paidDate: e.target.value }))} />
            </div>
            <div>
              <Label>Forma de Pagamento</Label>
              <Select value={payForm.paymentMethod} onValueChange={v => setPayForm(f => ({ ...f, paymentMethod: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Conta Bancária</Label>
              <Select value={payForm.bankAccountId} onValueChange={v => setPayForm(f => ({ ...f, bankAccountId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {accounts.filter(a => a.isActive).map(a => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPay(null)}>Cancelar</Button>
            <Button onClick={handlePay} disabled={payMutation.isPending}>
              {payMutation.isPending ? "Registrando..." : "Confirmar Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
