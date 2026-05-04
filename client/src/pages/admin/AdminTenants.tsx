/**
 * Control Plane — Assinantes
 * Rota: /admin/tenants
 */
import { useState } from "react";
import { CoreLayout } from "@/components/CoreLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Building2, Search, Clock, CheckCircle2, XCircle, AlertCircle, Trash2, RefreshCw, Ban, Play, Eye, Gift, X as GiftOff } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  trial:         { label: "Trial",          color: "#3b82f6", icon: Clock },
  active:        { label: "Ativo",          color: "#22c55e", icon: CheckCircle2 },
  past_due:      { label: "Vencido",        color: "#eab308", icon: AlertCircle },
  suspended:     { label: "Suspenso",       color: "#f97316", icon: Ban },
  canceled:      { label: "Cancelado",      color: "#ef4444", icon: XCircle },
  expired:       { label: "Expirado",       color: "#6b7280", icon: XCircle },
  free:          { label: "Gratuito",       color: "#a855f7", icon: Gift },
  free_expired:  { label: "Gratuito Exp.",  color: "#6b7280", icon: GiftOff },
  trial_expired: { label: "Trial Expirado", color: "#6b7280", icon: XCircle },
};

export default function AdminTenants() {
  const [search, setSearch] = useState("");
  const [extendDialog, setExtendDialog] = useState<{ id: number; name: string } | null>(null);
  const [extendDays, setExtendDays] = useState("7");
  const [deleteDialog, setDeleteDialog] = useState<{ id: number; name: string } | null>(null);
  const [freeAccessDialog, setFreeAccessDialog] = useState<{ id: number; name: string; hasFree: boolean } | null>(null);
  const [freeAccessType, setFreeAccessType] = useState<"indefinite" | "date">("indefinite");
  const [freeAccessDate, setFreeAccessDate] = useState("");
  const [freeAccessNote, setFreeAccessNote] = useState("");

  const utils = trpc.useUtils();
  const tenantsQuery = trpc.tenants.adminList.useQuery();

  const extendMutation = trpc.tenants.adminExtendTrial.useMutation({
    onSuccess: () => {
      toast.success("Trial estendido com sucesso");
      setExtendDialog(null);
      utils.tenants.adminList.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const suspendMutation = trpc.tenants.adminSuspend.useMutation({
    onSuccess: () => { toast.success("Tenant suspenso"); utils.tenants.adminList.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const reactivateMutation = trpc.tenants.adminReactivate.useMutation({
    onSuccess: () => { toast.success("Tenant reativado"); utils.tenants.adminList.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const impersonateMutation = trpc.admin.impersonate.useMutation({
    onSuccess: () => {
      toast.success("Acessando como tenant... redirecionando");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 600);
    },
    onError: (e) => toast.error(e.message),
  });

  const grantFreeAccessMutation = trpc.admin.grantFreeAccess.useMutation({
    onSuccess: () => {
      toast.success("Acesso gratuito concedido com sucesso!");
      setFreeAccessDialog(null);
      setFreeAccessNote("");
      setFreeAccessDate("");
      utils.tenants.adminList.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const revokeFreeAccessMutation = trpc.admin.revokeFreeAccess.useMutation({
    onSuccess: () => {
      toast.success("Acesso gratuito revogado.");
      setFreeAccessDialog(null);
      utils.tenants.adminList.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.tenants.adminDeleteTenant.useMutation({
    onSuccess: () => {
      toast.success("Tenant excluído");
      setDeleteDialog(null);
      utils.tenants.adminList.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = (tenantsQuery.data ?? []).filter((t: any) =>
    !search || t.name?.toLowerCase().includes(search.toLowerCase()) || t.cpfCnpj?.includes(search)
  );

  return (
    <CoreLayout title="Assinantes">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#64748b" }} />
            <Input
              placeholder="Buscar por nome ou CPF/CNPJ…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 border"
              style={{ background: "#161b27", borderColor: "#1e2535", color: "#e2e8f0" }}
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => utils.tenants.adminList.invalidate()}
            style={{ borderColor: "#1e2535", color: "#94a3b8", background: "transparent" }}>
            <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
          </Button>
        </div>

        <Card style={{ background: "#161b27", borderColor: "#1e2535" }}>
          <CardHeader>
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Building2 className="w-4 h-4" style={{ color: "#1B4F8A" }} />
              {filtered.length} tenant{filtered.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: "#1e2535" }}>
                  {["Empresa", "CPF/CNPJ", "WhatsApp", "Status", "Criado em", "Ações"].map((h) => (
                    <TableHead key={h} style={{ color: "#64748b" }}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenantsQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8" style={{ color: "#64748b" }}>
                      Carregando…
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8" style={{ color: "#64748b" }}>
                      Nenhum tenant encontrado
                    </TableCell>
                  </TableRow>
                ) : filtered.map((t: any) => {
                  const now = new Date();
                  const effectiveStatus = t.freeAccessEnabled
                    ? (t.freeAccessExpiresAt && new Date(t.freeAccessExpiresAt) < now ? "free_expired" : "free")
                    : t.subscriptionStatus;
                  const cfg = STATUS_CONFIG[effectiveStatus] ?? STATUS_CONFIG["trial"];
                  const Icon = cfg.icon;
                  return (
                    <TableRow key={t.id} style={{ borderColor: "#1e2535" }}>
                      <TableCell className="font-medium text-white">{t.name}</TableCell>
                      <TableCell style={{ color: "#94a3b8" }}>{t.cpfCnpj || "—"}</TableCell>
                      <TableCell style={{ color: "#94a3b8" }}>{t.whatsapp || "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="gap-1 border w-fit"
                            style={{ color: cfg.color, borderColor: cfg.color + "40", background: cfg.color + "15" }}>
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </Badge>
                          {t.freeAccessEnabled && t.freeAccessExpiresAt && (
                            <span className="text-xs" style={{ color: "#64748b" }}>
                              até {new Date(t.freeAccessExpiresAt).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                          {t.freeAccessEnabled && !t.freeAccessExpiresAt && (
                            <span className="text-xs" style={{ color: "#a855f7" }}>indefinido</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell style={{ color: "#64748b" }}>
                        {new Date(t.createdAt).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs"
                            style={{ color: "#3b82f6" }}
                            onClick={() => setExtendDialog({ id: t.id, name: t.name })}>
                            <Clock className="w-3 h-3 mr-1" /> Trial
                          </Button>
                          {t.subscriptionStatus !== "suspended" ? (
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs"
                              style={{ color: "#f97316" }}
                              onClick={() => suspendMutation.mutate({ tenantId: t.id })}>
                              <Ban className="w-3 h-3 mr-1" /> Suspender
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs"
                              style={{ color: "#22c55e" }}
                              onClick={() => reactivateMutation.mutate({ tenantId: t.id })}>
                              <Play className="w-3 h-3 mr-1" /> Reativar
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs"
                            style={{ color: "#a855f7" }}
                            title="Acessar como este tenant (impersonation)"
                            disabled={impersonateMutation.isPending}
                            onClick={() => impersonateMutation.mutate({ tenantId: t.id })}>
                            <Eye className="w-3 h-3 mr-1" /> Acessar
                          </Button>
                          {t.freeAccessEnabled ? (
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs"
                              style={{ color: "#ef4444" }}
                              title="Revogar acesso gratuito"
                              onClick={() => setFreeAccessDialog({ id: t.id, name: t.name, hasFree: true })}>
                              <GiftOff className="w-3 h-3 mr-1" /> Revogar
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs"
                              style={{ color: "#a855f7" }}
                              title="Conceder acesso gratuito"
                              onClick={() => { setFreeAccessType("indefinite"); setFreeAccessNote(""); setFreeAccessDate(""); setFreeAccessDialog({ id: t.id, name: t.name, hasFree: false }); }}>
                              <Gift className="w-3 h-3 mr-1" /> Gratuito
                            </Button>
                          )}
                          {t.subscriptionStatus === "trial" && (
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs"
                              style={{ color: "#ef4444" }}
                              onClick={() => setDeleteDialog({ id: t.id, name: t.name })}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Extend trial dialog */}
      <Dialog open={!!extendDialog} onOpenChange={() => setExtendDialog(null)}>
        <DialogContent style={{ background: "#161b27", borderColor: "#1e2535" }}>
          <DialogHeader>
            <DialogTitle className="text-white">Estender Trial — {extendDialog?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm mb-2 block" style={{ color: "#94a3b8" }}>Dias adicionais</label>
            <Input
              type="number" min="1" max="365" value={extendDays}
              onChange={(e) => setExtendDays(e.target.value)}
              style={{ background: "#0f1117", borderColor: "#1e2535", color: "#e2e8f0" }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendDialog(null)}
              style={{ borderColor: "#1e2535", color: "#94a3b8", background: "transparent" }}>
              Cancelar
            </Button>
            <Button
              onClick={() => extendMutation.mutate({ tenantId: extendDialog!.id, days: parseInt(extendDays) })}
              disabled={extendMutation.isPending}
              style={{ background: "#1B4F8A", color: "#fff" }}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Free Access dialog */}
      <Dialog open={!!freeAccessDialog} onOpenChange={() => setFreeAccessDialog(null)}>
        <DialogContent style={{ background: "#161b27", borderColor: "#1e2535" }}>
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Gift className="w-4 h-4" style={{ color: "#a855f7" }} />
              {freeAccessDialog?.hasFree ? "Revogar Acesso Gratuito" : "Conceder Acesso Gratuito"}
            </DialogTitle>
          </DialogHeader>
          {freeAccessDialog?.hasFree ? (
            <div className="py-4">
              <p className="text-sm" style={{ color: "#94a3b8" }}>
                Tem certeza que deseja revogar o acesso gratuito de{" "}
                <strong className="text-white">{freeAccessDialog?.name}</strong>?{" "}
                O tenant voltará ao status anterior de pagamento.
              </p>
            </div>
          ) : (
            <div className="py-4 space-y-4">
              <p className="text-sm" style={{ color: "#94a3b8" }}>
                Liberar acesso gratuito para{" "}
                <strong className="text-white">{freeAccessDialog?.name}</strong>{" "}
                elimina qualquer compromisso de pagamento.
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: "#e2e8f0" }}>Duração</label>
                <div className="flex gap-2">
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setFreeAccessType("indefinite")}
                    style={{
                      borderColor: freeAccessType === "indefinite" ? "#a855f7" : "#1e2535",
                      color: freeAccessType === "indefinite" ? "#a855f7" : "#94a3b8",
                      background: freeAccessType === "indefinite" ? "#a855f720" : "transparent",
                    }}>
                    Indefinido
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setFreeAccessType("date")}
                    style={{
                      borderColor: freeAccessType === "date" ? "#a855f7" : "#1e2535",
                      color: freeAccessType === "date" ? "#a855f7" : "#94a3b8",
                      background: freeAccessType === "date" ? "#a855f720" : "transparent",
                    }}>
                    Com data de expiração
                  </Button>
                </div>
              </div>
              {freeAccessType === "date" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ color: "#e2e8f0" }}>Data de expiração</label>
                  <input
                    type="date"
                    value={freeAccessDate}
                    onChange={(e) => setFreeAccessDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    style={{ background: "#0f1117", borderColor: "#1e2535", color: "#e2e8f0" }}
                  />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: "#e2e8f0" }}>Observação interna (opcional)</label>
                <Textarea
                  placeholder="Ex: Parceiro estratégico, usuário de teste, influenciador..."
                  value={freeAccessNote}
                  onChange={(e) => setFreeAccessNote(e.target.value)}
                  rows={3}
                  style={{ background: "#0f1117", borderColor: "#1e2535", color: "#e2e8f0" }}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setFreeAccessDialog(null)}
              style={{ borderColor: "#1e2535", color: "#94a3b8", background: "transparent" }}>
              Cancelar
            </Button>
            {freeAccessDialog?.hasFree ? (
              <Button
                onClick={() => revokeFreeAccessMutation.mutate({ tenantId: freeAccessDialog!.id })}
                disabled={revokeFreeAccessMutation.isPending}
                style={{ background: "#ef4444", color: "#fff" }}>
                Revogar Acesso
              </Button>
            ) : (
              <Button
                onClick={() => grantFreeAccessMutation.mutate({
                  tenantId: freeAccessDialog!.id,
                  expiresAt: freeAccessType === "date" && freeAccessDate
                    ? new Date(freeAccessDate + "T23:59:59").toISOString()
                    : null,
                  note: freeAccessNote || undefined,
                })}
                disabled={grantFreeAccessMutation.isPending || (freeAccessType === "date" && !freeAccessDate)}
                style={{ background: "#a855f7", color: "#fff" }}>
                Conceder Acesso Gratuito
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent style={{ background: "#161b27", borderColor: "#1e2535" }}>
          <DialogHeader>
            <DialogTitle className="text-white">Excluir Tenant em Trial</DialogTitle>
          </DialogHeader>
          <p className="text-sm py-4" style={{ color: "#94a3b8" }}>
            Tem certeza que deseja excluir <strong className="text-white">{deleteDialog?.name}</strong>?
            Esta ação é irreversível.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}
              style={{ borderColor: "#1e2535", color: "#94a3b8", background: "transparent" }}>
              Cancelar
            </Button>
            <Button
              onClick={() => deleteMutation.mutate({ tenantId: deleteDialog!.id })}
              disabled={deleteMutation.isPending}
              style={{ background: "#ef4444", color: "#fff" }}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CoreLayout>
  );
}
