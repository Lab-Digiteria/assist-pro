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
import { Building2, Search, Clock, CheckCircle2, XCircle, AlertCircle, Trash2, RefreshCw, Ban, Play, Eye } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  trial:     { label: "Trial",     color: "#3b82f6", icon: Clock },
  active:    { label: "Ativo",     color: "#22c55e", icon: CheckCircle2 },
  past_due:  { label: "Vencido",   color: "#eab308", icon: AlertCircle },
  suspended: { label: "Suspenso",  color: "#f97316", icon: Ban },
  canceled:  { label: "Cancelado", color: "#ef4444", icon: XCircle },
  expired:   { label: "Expirado",  color: "#6b7280", icon: XCircle },
};

export default function AdminTenants() {
  const [search, setSearch] = useState("");
  const [extendDialog, setExtendDialog] = useState<{ id: number; name: string } | null>(null);
  const [extendDays, setExtendDays] = useState("7");
  const [deleteDialog, setDeleteDialog] = useState<{ id: number; name: string } | null>(null);

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
                  const cfg = STATUS_CONFIG[t.subscriptionStatus] ?? STATUS_CONFIG["trial"];
                  const Icon = cfg.icon;
                  return (
                    <TableRow key={t.id} style={{ borderColor: "#1e2535" }}>
                      <TableCell className="font-medium text-white">{t.name}</TableCell>
                      <TableCell style={{ color: "#94a3b8" }}>{t.cpfCnpj || "—"}</TableCell>
                      <TableCell style={{ color: "#94a3b8" }}>{t.whatsapp || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1 border"
                          style={{ color: cfg.color, borderColor: cfg.color + "40", background: cfg.color + "15" }}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </Badge>
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
              type="number" min="1" max="90" value={extendDays}
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
