import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { Plus, BookOpen } from "lucide-react";

const TYPE_CONFIG = {
  receita: { label: "Receita", color: "bg-green-100 text-green-800" },
  custo: { label: "Custo", color: "bg-orange-100 text-orange-800" },
  despesa: { label: "Despesa", color: "bg-red-100 text-red-800" },
};

export default function PlanoContas() {
  const utils = trpc.useUtils();
  const { data: accounts = [], isLoading } = trpc.financeiroV2.chartOfAccounts.list.useQuery();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", type: "receita" as string, parentId: "" });

  const createMutation = trpc.financeiroV2.chartOfAccounts.create.useMutation({
    onSuccess: () => {
      utils.financeiroV2.chartOfAccounts.list.invalidate();
      setShowCreate(false);
      setForm({ code: "", name: "", type: "receita", parentId: "" });
      toast.success("Conta criada!");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.financeiroV2.chartOfAccounts.update.useMutation({
    onSuccess: () => {
      utils.financeiroV2.chartOfAccounts.list.invalidate();
      toast.success("Conta atualizada!");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = () => {
    if (!form.code || !form.name || !form.type) return;
    createMutation.mutate({
      code: form.code,
      name: form.name,
      type: form.type as any,
      parentId: form.parentId ? parseInt(form.parentId) : undefined,
    });
  };

  // Agrupar por tipo
  const byType = {
    receita: accounts.filter(a => a.type === "receita"),
    custo: accounts.filter(a => a.type === "custo"),
    despesa: accounts.filter(a => a.type === "despesa"),
  };

  return (
    <AppLayout title="Plano de Contas">
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Plano de Contas</h1>
            <p className="text-muted-foreground text-sm">Categorias para classificar receitas e despesas</p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nova Conta
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : accounts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <BookOpen className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Carregando plano de contas padrão...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {(["receita", "custo", "despesa"] as const).map(type => {
              const list = byType[type];
              if (list.length === 0) return null;
              const cfg = TYPE_CONFIG[type];
              return (
                <Card key={type}>
                  <CardContent className="p-0">
                    <div className={`px-4 py-3 border-b font-semibold text-sm ${cfg.color} rounded-t-lg`}>
                      {cfg.label}s — {list.length} conta(s)
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left p-3 font-medium">Código</th>
                          <th className="text-left p-3 font-medium">Nome</th>
                          <th className="text-center p-3 font-medium">Status</th>
                          <th className="text-center p-3 font-medium">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map(acc => (
                          <tr key={acc.id} className="border-b hover:bg-muted/20 transition-colors">
                            <td className="p-3 font-mono text-xs text-muted-foreground">{acc.code}</td>
                            <td className="p-3">
                              <span style={{ paddingLeft: `${(acc.code.split(".").length - 1) * 16}px` }}>
                                {acc.name}
                              </span>
                              {acc.isSystem && (
                                <span className="ml-2 text-xs text-muted-foreground">(padrão)</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <Badge variant={acc.isActive ? "default" : "secondary"}>
                                {acc.isActive ? "Ativa" : "Inativa"}
                              </Badge>
                            </td>
                            <td className="p-3 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateMutation.mutate({ id: acc.id, isActive: !acc.isActive })}
                              >
                                {acc.isActive ? "Desativar" : "Ativar"}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
            <DialogTitle>Nova Conta no Plano</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Código *</Label>
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="Ex: 1.4" />
              </div>
              <div>
                <Label>Tipo *</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="custo">Custo</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Nome *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome da conta" />
            </div>
            <div>
              <Label>Conta Pai (opcional)</Label>
              <Select value={form.parentId} onValueChange={v => setForm(f => ({ ...f, parentId: v }))}>
                <SelectTrigger><SelectValue placeholder="Nenhuma (conta raiz)" /></SelectTrigger>
                <SelectContent>
                  {accounts.filter(a => a.type === form.type && a.isActive).map(a => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.code} — {a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
