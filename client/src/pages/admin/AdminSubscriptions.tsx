/**
 * Control Plane — Assinaturas
 * Rota: /admin/subscriptions
 */
import { CoreLayout } from "@/components/CoreLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Clock, CheckCircle2, XCircle, AlertCircle, Ban } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const STATUS_CFG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  trialing: { label: "Trial",     color: "#3b82f6", icon: Clock },
  active:   { label: "Ativo",     color: "#22c55e", icon: CheckCircle2 },
  past_due: { label: "Vencido",   color: "#eab308", icon: AlertCircle },
  suspended:{ label: "Suspenso",  color: "#f97316", icon: Ban },
  canceled: { label: "Cancelado", color: "#ef4444", icon: XCircle },
  expired:  { label: "Expirado",  color: "#6b7280", icon: XCircle },
};

export default function AdminSubscriptions() {
  const subsQuery = trpc.tenants.adminListSubscriptions.useQuery();

  return (
    <CoreLayout title="Assinaturas">
      <Card style={{ background: "#161b27", borderColor: "#1e2535" }}>
        <CardHeader>
          <CardTitle className="text-base text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4" style={{ color: "#1B4F8A" }} />
            {(subsQuery.data ?? []).length} assinatura{(subsQuery.data ?? []).length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: "#1e2535" }}>
                {["Tenant", "Status", "Plano", "Trial até", "Período até", "Stripe ID", "Criado em"].map(h => (
                  <TableHead key={h} style={{ color: "#64748b" }}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {subsQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8" style={{ color: "#64748b" }}>Carregando…</TableCell>
                </TableRow>
              ) : (subsQuery.data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8" style={{ color: "#64748b" }}>Nenhuma assinatura</TableCell>
                </TableRow>
              ) : (subsQuery.data ?? []).map((s: any) => {
                const cfg = STATUS_CFG[s.status] ?? STATUS_CFG["trialing"];
                const Icon = cfg.icon;
                return (
                  <TableRow key={s.id} style={{ borderColor: "#1e2535" }}>
                    <TableCell className="text-white font-medium">{s.tenantName || `#${s.tenantId}`}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1 border text-xs"
                        style={{ color: cfg.color, borderColor: cfg.color + "40", background: cfg.color + "15" }}>
                        <Icon className="w-3 h-3" />{cfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ color: "#94a3b8" }}>{s.planId?.slice(0, 8) || "—"}</TableCell>
                    <TableCell style={{ color: "#94a3b8" }}>
                      {s.trialEndsAt ? new Date(s.trialEndsAt).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell style={{ color: "#94a3b8" }}>
                      {s.currentPeriodEndsAt ? new Date(s.currentPeriodEndsAt).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell style={{ color: "#64748b" }} className="font-mono text-xs">
                      {s.stripeSubscriptionId ? s.stripeSubscriptionId.slice(0, 14) + "…" : "—"}
                    </TableCell>
                    <TableCell style={{ color: "#64748b" }}>
                      {new Date(s.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </CoreLayout>
  );
}
