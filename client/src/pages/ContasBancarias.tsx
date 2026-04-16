import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Plus, ArrowLeftRight, Building2, Wallet, PiggyBank, Smartphone } from "lucide-react";

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

const ACCOUNT_TYPES = [
  { value: "checking", label: "Conta Corrente", icon: Building2 },
  { value: "savings", label: "Poupança", icon: PiggyBank },
  { value: "cash", label: "Caixa", icon: Wallet },
  { value: "digital", label: "Conta Digital", icon: Smartphone },
] as const;

export default function ContasBancarias() {
  const utils = trpc.useUtils();
  const { data: accounts = [], isLoading } = trpc.financeiroV2.bankAccounts.list.useQuery();

  const [showCreate, setShowCreate] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [form, setForm] = useState({ name: "", type: "checking" as string, bankName: "", agency: "", accountNumber: "", initialBalance: "0" });
  const [transfer, setTransfer] = useState({ fromAccountId: "", toAccountId: "", amount: "", description: "" });

  const createMutation = trpc.financeiroV2.bankAccounts.create.useMutation({
    onSuccess: () => {
      utils.financeiroV2.bankAccounts.list.invalidate();
      utils.financeiroV2.dashboardFinanceiro.invalidate();
      setShowCreate(false);
      setForm({ name: "", type: "checking", bankName: "", agency: "", accountNumber: "", initialBalance: "0" });
      toast.success("Conta criada com sucesso!");
    },
    onError: (e) => toast.error(e.message),
  });

  const transferMutation = trpc.financeiroV2.bankAccounts.transfer.useMutation({
    onSuccess: () => {
      utils.financeiroV2.bankAccounts.list.invalidate();
      utils.financeiroV2.dashboardFinanceiro.invalidate();
      setShowTransfer(false);
      setTransfer({ fromAccountId: "", toAccountId: "", amount: "", description: "" });
      toast.success("Transferência realizada!");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.financeiroV2.bankAccounts.update.useMutation({
    onSuccess: () => {
      utils.financeiroV2.bankAccounts.list.invalidate();
      toast.success("Conta atualizada!");
    },
  });

  const handleCreate = () => {
    if (!form.name || !form.type) return;
    createMutation.mutate({
      name: form.name,
      type: form.type as any,
      bankName: form.bankName || undefined,
      agency: form.agency || undefined,
      accountNumber: form.accountNumber || undefined,
      initialBalance: parseFloat(form.initialBalance) || 0,
    });
  };

  const handleTransfer = () => {
    if (!transfer.fromAccountId || !transfer.toAccountId || !transfer.amount) return;
    transferMutation.mutate({
      fromAccountId: parseInt(transfer.fromAccountId),
      toAccountId: parseInt(transfer.toAccountId),
      amount: parseFloat(transfer.amount),
      description: transfer.description || undefined,
    });
  };

  const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.currentBalance), 0);

  return (
    <AppLayout title="Contas Bancárias">
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Contas Bancárias</h1>
            <p className="text-muted-foreground text-sm">Gerencie suas contas e caixas</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowTransfer(true)}>
              <ArrowLeftRight className="h-4 w-4 mr-2" /> Transferir
            </Button>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" /> Nova Conta
            </Button>
          </div>
        </div>

        {/* Saldo total */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-6">
            <p className="text-sm opacity-80">Saldo Total</p>
            <p className="text-4xl font-bold mt-1">{fmt(totalBalance)}</p>
            <p className="text-sm opacity-70 mt-1">{accounts.filter(a => a.isActive).length} conta(s) ativa(s)</p>
          </CardContent>
        </Card>

        {/* Lista de contas */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : accounts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <Building2 className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma conta cadastrada</p>
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-2" /> Criar primeira conta
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map(acc => {
              const typeInfo = ACCOUNT_TYPES.find(t => t.value === acc.type);
              const Icon = typeInfo?.icon ?? Wallet;
              const balance = parseFloat(acc.currentBalance);
              return (
                <Card key={acc.id} className={!acc.isActive ? "opacity-50" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-base">{acc.name}</CardTitle>
                      </div>
                      <Badge variant={acc.isActive ? "default" : "secondary"}>
                        {acc.isActive ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-3xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {fmt(balance)}
                    </p>
                    {acc.bankName && (
                      <p className="text-xs text-muted-foreground mt-2">{acc.bankName}</p>
                    )}
                    {acc.agency && acc.accountNumber && (
                      <p className="text-xs text-muted-foreground">
                        Ag: {acc.agency} · CC: {acc.accountNumber}
                      </p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => updateMutation.mutate({ id: acc.id, isActive: !acc.isActive })}
                      >
                        {acc.isActive ? "Desativar" : "Ativar"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Nova Conta */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Conta Bancária</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome da Conta *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Bradesco Corrente" />
            </div>
            <div>
              <Label>Tipo *</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Banco</Label>
              <Input value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} placeholder="Ex: Bradesco" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Agência</Label>
                <Input value={form.agency} onChange={e => setForm(f => ({ ...f, agency: e.target.value }))} placeholder="0001" />
              </div>
              <div>
                <Label>Conta</Label>
                <Input value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))} placeholder="12345-6" />
              </div>
            </div>
            <div>
              <Label>Saldo Inicial (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.initialBalance}
                onChange={e => setForm(f => ({ ...f, initialBalance: e.target.value }))}
                placeholder="0,00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Criando..." : "Criar Conta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Transferência */}
      <Dialog open={showTransfer} onOpenChange={setShowTransfer}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transferência entre Contas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Conta de Origem *</Label>
              <Select value={transfer.fromAccountId} onValueChange={v => setTransfer(t => ({ ...t, fromAccountId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {accounts.filter(a => a.isActive).map(a => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.name} ({fmt(parseFloat(a.currentBalance))})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Conta de Destino *</Label>
              <Select value={transfer.toAccountId} onValueChange={v => setTransfer(t => ({ ...t, toAccountId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {accounts.filter(a => a.isActive && String(a.id) !== transfer.fromAccountId).map(a => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                value={transfer.amount}
                onChange={e => setTransfer(t => ({ ...t, amount: e.target.value }))}
                placeholder="0,00"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={transfer.description} onChange={e => setTransfer(t => ({ ...t, description: e.target.value }))} placeholder="Opcional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransfer(false)}>Cancelar</Button>
            <Button onClick={handleTransfer} disabled={transferMutation.isPending}>
              {transferMutation.isPending ? "Transferindo..." : "Transferir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
