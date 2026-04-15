import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Building2, Users, RefreshCw, PauseCircle, PlayCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { SUBSCRIPTION_STATUS_LABELS } from "../../../shared/utils";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

function statusColor(status: string | null) {
  switch (status) {
    case "active": return "bg-green-100 text-green-700 border-green-200";
    case "trial": case "trialing": return "bg-blue-100 text-blue-700 border-blue-200";
    case "suspended": return "bg-red-100 text-red-700 border-red-200";
    case "canceled": case "expired": return "bg-gray-100 text-gray-600 border-gray-200";
    case "past_due": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    default: return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

export default function AdminPanel() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [extendDays, setExtendDays] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!loading && user && user.role !== "admin") {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const utils = trpc.useUtils();
  const { data: tenants = [], isLoading } = trpc.tenants.adminList.useQuery();
  const { data: leads = [] } = trpc.leads.list.useQuery();

  const reconcile = trpc.tenants.stripeReconcile.useMutation({
    onSuccess: (r) => toast.success(`Reconciliação: ${r.checked} verificados, ${r.corrected} corrigidos`),
    onError: (e) => toast.error(e.message),
  });

  const extendTrial = trpc.tenants.adminExtendTrial.useMutation({
    onSuccess: () => { toast.success("Trial estendido!"); utils.tenants.adminList.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const suspend = trpc.tenants.adminSuspend.useMutation({
    onSuccess: () => { toast.success("Tenant suspenso."); utils.tenants.adminList.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const reactivate = trpc.tenants.adminReactivate.useMutation({
    onSuccess: () => { toast.success("Tenant reativado!"); utils.tenants.adminList.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const totalActive = tenants.filter((t) => t.subscriptionStatus === "active").length;
  const totalTrial = tenants.filter((t) => ["trial", "trialing"].includes(t.subscriptionStatus ?? "")).length;
  const totalSuspended = tenants.filter((t) => t.subscriptionStatus === "suspended").length;

  return (
    <AppLayout title="Painel Admin">
      <div className="space-y-6">
        {/* Header actions */}
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => reconcile.mutate()} disabled={reconcile.isPending}>
            <RefreshCw className="w-3 h-3 mr-1" />
            {reconcile.isPending ? "Reconciliando..." : "Reconciliar Stripe"}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-xs text-muted-foreground">Total Tenants</p>
              <p className="text-2xl font-bold text-primary">{tenants.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-xs text-muted-foreground">Ativos</p>
              <p className="text-2xl font-bold text-green-600">{totalActive}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-xs text-muted-foreground">Em Trial</p>
              <p className="text-2xl font-bold text-blue-600">{totalTrial}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-xs text-muted-foreground">Suspensos</p>
              <p className="text-2xl font-bold text-red-600">{totalSuspended}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tenants table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Tenants ({tenants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : tenants.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum tenant cadastrado.</p>
            ) : (
              <div className="space-y-3">
                {tenants.map((t) => (
                  <div key={t.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.cpfCnpj} · {t.whatsapp}</p>
                        {t.email && <p className="text-xs text-muted-foreground">{t.email}</p>}
                      </div>
                      <Badge className={statusColor(t.subscriptionStatus)}>
                        {SUBSCRIPTION_STATUS_LABELS[t.subscriptionStatus ?? "trial"] ?? t.subscriptionStatus}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Extend trial */}
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={1}
                          max={90}
                          placeholder="dias"
                          className="h-7 w-16 text-xs"
                          value={extendDays[t.id] ?? ""}
                          onChange={(e) => setExtendDays((prev) => ({ ...prev, [t.id]: e.target.value }))}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          disabled={extendTrial.isPending}
                          onClick={() => {
                            const days = parseInt(extendDays[t.id] ?? "7");
                            if (!days || days < 1) return toast.error("Informe o número de dias");
                            extendTrial.mutate({ tenantId: t.id, days });
                            setExtendDays((prev) => ({ ...prev, [t.id]: "" }));
                          }}
                        >
                          <Clock className="w-3 h-3 mr-1" />Estender Trial
                        </Button>
                      </div>
                      {/* Suspend */}
                      {t.subscriptionStatus !== "suspended" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                          disabled={suspend.isPending}
                          onClick={() => suspend.mutate({ tenantId: t.id })}
                        >
                          <PauseCircle className="w-3 h-3 mr-1" />Suspender
                        </Button>
                      )}
                      {/* Reactivate */}
                      {t.subscriptionStatus === "suspended" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-green-600 border-green-200 hover:bg-green-50"
                          disabled={reactivate.isPending}
                          onClick={() => reactivate.mutate({ tenantId: t.id })}
                        >
                          <PlayCircle className="w-3 h-3 mr-1" />Reativar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leads */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              Leads ({leads.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leads.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum lead cadastrado ainda.</p>
            ) : (
              <div className="space-y-2">
                {leads.map((l) => (
                  <div key={l.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{l.name}</p>
                      <p className="text-xs text-muted-foreground">{l.email} · {l.whatsapp}</p>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">{l.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
