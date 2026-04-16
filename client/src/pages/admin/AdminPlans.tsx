/**
 * Control Plane — Planos
 * Rota: /admin/planos
 * CRUD completo de planos de assinatura.
 */
import { useState } from "react";
import { CoreLayout } from "@/components/CoreLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Clock, CheckCircle2 } from "lucide-react";

type PlanForm = {
  name: string;
  slug: string;
  priceMonthly: string;
  trialDays: string;
  stripePriceId: string;
  isLifetime: boolean;
  isActive: boolean;
};

const EMPTY_FORM: PlanForm = {
  name: "",
  slug: "",
  priceMonthly: "",
  trialDays: "14",
  stripePriceId: "",
  isLifetime: false,
  isActive: true,
};

function fmt(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export default function AdminPlans() {
  const utils = trpc.useUtils();
  const { data: plans, isLoading } = trpc.admin.plans.list.useQuery();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PlanForm>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const createMutation = trpc.admin.plans.create.useMutation({
    onSuccess: () => { toast.success("Plano criado!"); utils.admin.plans.list.invalidate(); setDialogOpen(false); setForm(EMPTY_FORM); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.admin.plans.update.useMutation({
    onSuccess: () => { toast.success("Plano atualizado!"); utils.admin.plans.list.invalidate(); setDialogOpen(false); setEditingId(null); setForm(EMPTY_FORM); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.admin.plans.delete.useMutation({
    onSuccess: () => { toast.success("Plano excluído."); utils.admin.plans.list.invalidate(); setDeleteId(null); },
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => { setEditingId(null); setForm(EMPTY_FORM); setDialogOpen(true); };

  const openEdit = (plan: NonNullable<typeof plans>[number]) => {
    setEditingId(plan.id);
    setForm({ name: plan.name, slug: plan.slug, priceMonthly: String(plan.priceMonthly), trialDays: String(plan.trialDays), stripePriceId: plan.stripePriceId ?? "", isLifetime: plan.isLifetime, isActive: plan.isActive });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload = { name: form.name, slug: form.slug, priceMonthly: parseInt(form.priceMonthly, 10), trialDays: parseInt(form.trialDays, 10), stripePriceId: form.stripePriceId || undefined, isLifetime: form.isLifetime, isActive: form.isActive };
    if (editingId) updateMutation.mutate({ id: editingId, ...payload });
    else createMutation.mutate(payload);
  };

  return (
    <CoreLayout title="Planos">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Planos</h1>
            <p className="text-slate-400 text-sm mt-1">Gerencie os planos de assinatura da plataforma</p>
          </div>
          <Button onClick={openCreate} className="bg-[#1B4F8A] hover:bg-[#163f6e] text-white">
            <Plus className="w-4 h-4 mr-2" />
            Novo Plano
          </Button>
        </div>

        {isLoading ? (
          <p style={{ color: "#64748b" }}>Carregando…</p>
        ) : !plans || plans.length === 0 ? (
          <Card style={{ background: "#161b27", borderColor: "#1e2535" }}>
            <CardContent className="py-12 text-center">
              <p className="text-slate-500">Nenhum plano cadastrado.</p>
              <Button onClick={openCreate} className="mt-4 bg-[#1B4F8A] hover:bg-[#163f6e] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Criar primeiro plano
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} style={{ background: "#161b27", borderColor: "#1e2535" }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-white">{plan.name}</CardTitle>
                    <div className="flex gap-1">
                      {plan.isActive ? (
                        <Badge variant="outline" style={{ color: "#22c55e", borderColor: "#22c55e40", background: "#22c55e15" }}>
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" style={{ color: "#64748b", borderColor: "#64748b40" }}>Inativo</Badge>
                      )}
                      {plan.isLifetime && (
                        <Badge variant="outline" style={{ color: "#a855f7", borderColor: "#a855f740", background: "#a855f715" }}>Vitalício</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-white">{fmt(plan.priceMonthly)}</span>
                    {!plan.isLifetime && <span className="text-xs" style={{ color: "#64748b" }}>/mês</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs" style={{ color: "#64748b" }}>
                    <Clock className="w-3.5 h-3.5" style={{ color: "#22c55e" }} />
                    Trial de {plan.trialDays} dias
                  </div>
                  {plan.stripePriceId && (
                    <div className="text-xs font-mono truncate" style={{ color: "#64748b" }}>{plan.stripePriceId}</div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(plan)} className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700">
                      <Pencil className="w-3 h-3 mr-1" /> Editar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setDeleteId(plan.id)} className="border-red-900 text-red-400 hover:bg-red-950">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent style={{ background: "#161b27", borderColor: "#1e2535" }}>
            <DialogHeader>
              <DialogTitle className="text-white">{editingId ? "Editar Plano" : "Novo Plano"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-slate-300">Nome</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Plano Mensal" className="bg-slate-800 border-slate-600 text-white" />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-300">Slug</Label>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="mensal" className="bg-slate-800 border-slate-600 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-slate-300">Preço (centavos)</Label>
                  <Input type="number" value={form.priceMonthly} onChange={(e) => setForm({ ...form, priceMonthly: e.target.value })} placeholder="9900" className="bg-slate-800 border-slate-600 text-white" />
                  <p className="text-xs text-slate-500">Ex: 9900 = R$99,00</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-300">Dias de Trial</Label>
                  <Input type="number" value={form.trialDays} onChange={(e) => setForm({ ...form, trialDays: e.target.value })} placeholder="14" className="bg-slate-800 border-slate-600 text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-slate-300">Stripe Price ID (opcional)</Label>
                <Input value={form.stripePriceId} onChange={(e) => setForm({ ...form, stripePriceId: e.target.value })} placeholder="price_..." className="bg-slate-800 border-slate-600 text-white font-mono text-sm" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch checked={form.isLifetime} onCheckedChange={(v) => setForm({ ...form, isLifetime: v })} />
                  <Label className="text-slate-300">Plano Vitalício</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
                  <Label className="text-slate-300">Ativo</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-600 text-slate-300">Cancelar</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="bg-[#1B4F8A] hover:bg-[#163f6e] text-white">
                {editingId ? "Salvar" : "Criar Plano"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <DialogContent style={{ background: "#161b27", borderColor: "#1e2535" }}>
            <DialogHeader>
              <DialogTitle className="text-white">Confirmar Exclusão</DialogTitle>
            </DialogHeader>
            <p className="text-slate-400 text-sm">Tem certeza que deseja excluir este plano? Planos com assinaturas ativas não podem ser excluídos.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)} className="border-slate-600 text-slate-300">Cancelar</Button>
              <Button onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })} disabled={deleteMutation.isPending} className="bg-red-900 hover:bg-red-800 text-white">
                <Trash2 className="w-4 h-4 mr-2" /> Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CoreLayout>
  );
}
