/**
 * Control Plane — Billing
 * Rota: /admin/billing
 */
import { CoreLayout } from "@/components/CoreLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, RefreshCw, CheckCircle2, Clock, XCircle, AlertCircle, Ban } from "lucide-react";

const STATUS_CFG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  trialing: { label: "Trial",     color: "#3b82f6", icon: Clock },
  active:   { label: "Ativo",     color: "#22c55e", icon: CheckCircle2 },
  past_due: { label: "Vencido",   color: "#eab308", icon: AlertCircle },
  suspended:{ label: "Suspenso",  color: "#f97316", icon: Ban },
  canceled: { label: "Cancelado", color: "#ef4444", icon: XCircle },
  expired:  { label: "Expirado",  color: "#6b7280", icon: XCircle },
};

export default function AdminBilling() {
  const subsQuery = trpc.tenants.adminListSubscriptions.useQuery();
  const utils = trpc.useUtils();

  const reconcileMutation = trpc.tenants.stripeReconcile.useMutation({
    onSuccess: () => {
      toast.success("Reconciliação concluída");
      utils.tenants.adminListSubscriptions.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const subs = subsQuery.data ?? [];
  const active = subs.filter((s: any) => s.status === "active").length;
  const trialing = subs.filter((s: any) => s.status === "trialing").length;
  const pastDue = subs.filter((s: any) => s.status === "past_due").length;

  return (
    <CoreLayout title="Billing">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button
            onClick={() => reconcileMutation.mutate()}
            disabled={reconcileMutation.isPending}
            style={{ background: "#1B4F8A", color: "#fff" }}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${reconcileMutation.isPending ? "animate-spin" : ""}`} />
            Reconciliar com Stripe
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Assinaturas Ativas", value: active, color: "#22c55e" },
            { label: "Em Trial", value: trialing, color: "#3b82f6" },
            { label: "Pagamento Vencido", value: pastDue, color: "#eab308" },
          ].map((item) => (
            <Card key={item.label} style={{ background: "#161b27", borderColor: "#1e2535" }}>
              <CardContent className="pt-4">
                <p className="text-xs mb-1" style={{ color: "#64748b" }}>{item.label}</p>
                <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card style={{ background: "#161b27", borderColor: "#1e2535" }}>
          <CardHeader>
            <CardTitle className="text-base text-white flex items-center gap-2">
              <FileText className="w-4 h-4" style={{ color: "#1B4F8A" }} />
              Histórico de Assinaturas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {subs.map((s: any) => {
                const cfg = STATUS_CFG[s.status] ?? STATUS_CFG["trialing"];
                const Icon = cfg.icon;
                return (
                  <div key={s.id} className="flex items-center justify-between py-2.5 border-b last:border-0"
                    style={{ borderColor: "#1e2535" }}>
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                      <div>
                        <p className="text-sm font-medium text-white">{s.tenantName || `Tenant #${s.tenantId}`}</p>
                        <p className="text-xs font-mono" style={{ color: "#64748b" }}>
                          {s.stripeSubscriptionId || "Sem Stripe ID"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs border"
                        style={{ color: cfg.color, borderColor: cfg.color + "40", background: cfg.color + "15" }}>
                        {cfg.label}
                      </Badge>
                      <span className="text-xs" style={{ color: "#64748b" }}>
                        {new Date(s.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                );
              })}
              {subs.length === 0 && (
                <p className="text-center py-8 text-sm" style={{ color: "#64748b" }}>
                  Nenhuma assinatura registrada
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </CoreLayout>
  );
}
