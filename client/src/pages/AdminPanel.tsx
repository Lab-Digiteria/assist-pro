import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Users, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { SUBSCRIPTION_STATUS_LABELS } from "../../../shared/utils";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function AdminPanel() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && user && user.role !== "admin") {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const { data: tenants = [], isLoading } = trpc.tenants.adminList.useQuery();
  const { data: leads = [] } = trpc.leads.list.useQuery();
  const reconcile = trpc.tenants.stripeReconcile.useMutation({
    onSuccess: (r) => toast.success(`Reconciliação: ${r.checked} verificados, ${r.corrected} corrigidos`),
    onError: (e) => toast.error(e.message),
  });
  const updateStatus = trpc.tenants.adminUpdateStatus.useMutation({
    onSuccess: () => toast.success("Status atualizado!"),
    onError: (e) => toast.error(e.message),
  });

  const totalActive = tenants.filter((t) => t.subscriptionStatus === "active").length;
  const totalTrial = tenants.filter((t) => t.subscriptionStatus === "trial").length;

  return (
    <AppLayout title="Painel Admin">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => reconcile.mutate()} disabled={reconcile.isPending}>
            <RefreshCw className="w-3 h-3 mr-1" />{reconcile.isPending ? "Reconciliando..." : "Reconciliar Stripe"}
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-3">
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
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4" />Tenants
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : (
              <div className="space-y-2">
                {tenants.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.cpfCnpj} · {t.whatsapp}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={
                        t.subscriptionStatus === "active" ? "bg-green-100 text-green-700" :
                        t.subscriptionStatus === "trial" ? "bg-blue-100 text-blue-700" :
                        "bg-red-100 text-red-700"
                      }>
                        {SUBSCRIPTION_STATUS_LABELS[t.subscriptionStatus ?? "trial"]}
                      </Badge>
                      <Select
                        value={t.subscriptionStatus ?? "trial"}
                        onValueChange={(v) => updateStatus.mutate({ tenantId: t.id, status: v as any })}
                      >
                        <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(SUBSCRIPTION_STATUS_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />Leads ({leads.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leads.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum lead cadastrado.</p>
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
