/**
 * Control Plane — Monitoramento Trials
 * Rota: /admin/trials
 */
import { CoreLayout } from "@/components/CoreLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Clock, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function daysLeft(trialEndsAt: string | Date | null): number {
  if (!trialEndsAt) return 0;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export default function AdminTrialMonitor() {
  const subsQuery = trpc.tenants.adminListSubscriptions.useQuery();
  const utils = trpc.useUtils();

  const extendMutation = trpc.tenants.adminExtendTrial.useMutation({
    onSuccess: () => { toast.success("Trial estendido"); utils.tenants.adminListSubscriptions.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const trials = (subsQuery.data ?? []).filter((s: any) => s.status === "trialing");
  const expiringSoon = trials.filter((s: any) => daysLeft(s.trialEndsAt) <= 3);
  const healthy = trials.filter((s: any) => daysLeft(s.trialEndsAt) > 3);

  return (
    <CoreLayout title="Monitoramento Trials">
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <Card style={{ background: "#161b27", borderColor: "#1e2535" }}>
            <CardContent className="pt-4">
              <p className="text-xs mb-1" style={{ color: "#64748b" }}>Total em Trial</p>
              <p className="text-2xl font-bold" style={{ color: "#3b82f6" }}>{trials.length}</p>
            </CardContent>
          </Card>
          <Card style={{ background: "#161b27", borderColor: "#1e2535" }}>
            <CardContent className="pt-4">
              <p className="text-xs mb-1" style={{ color: "#64748b" }}>Expirando em ≤3 dias</p>
              <p className="text-2xl font-bold" style={{ color: "#eab308" }}>{expiringSoon.length}</p>
            </CardContent>
          </Card>
          <Card style={{ background: "#161b27", borderColor: "#1e2535" }}>
            <CardContent className="pt-4">
              <p className="text-xs mb-1" style={{ color: "#64748b" }}>Saudáveis (&gt;3 dias)</p>
              <p className="text-2xl font-bold" style={{ color: "#22c55e" }}>{healthy.length}</p>
            </CardContent>
          </Card>
        </div>

        {expiringSoon.length > 0 && (
          <Card style={{ background: "#161b27", borderColor: "#eab30840" }}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2" style={{ color: "#eab308" }}>
                <AlertCircle className="w-4 h-4" />
                Atenção — Expirando em breve
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow style={{ borderColor: "#1e2535" }}>
                    {["Tenant", "Dias restantes", "Expira em", "Ação"].map(h => (
                      <TableHead key={h} style={{ color: "#64748b" }}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiringSoon.map((s: any) => {
                    const days = daysLeft(s.trialEndsAt);
                    return (
                      <TableRow key={s.id} style={{ borderColor: "#1e2535" }}>
                        <TableCell className="text-white font-medium">{s.tenantName || `#${s.tenantId}`}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border"
                            style={{ color: days === 0 ? "#ef4444" : "#eab308", borderColor: "#eab30840", background: "#eab30815" }}>
                            {days === 0 ? "Expirado hoje" : `${days} dia${days !== 1 ? "s" : ""}`}
                          </Badge>
                        </TableCell>
                        <TableCell style={{ color: "#94a3b8" }}>
                          {s.trialEndsAt ? new Date(s.trialEndsAt).toLocaleDateString("pt-BR") : "—"}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" className="h-7 text-xs"
                            style={{ background: "#1B4F8A", color: "#fff" }}
                            onClick={() => extendMutation.mutate({ tenantId: s.tenantId, days: 7 })}
                            disabled={extendMutation.isPending}>
                            <RefreshCw className="w-3 h-3 mr-1" /> +7 dias
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Card style={{ background: "#161b27", borderColor: "#1e2535" }}>
          <CardHeader>
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: "#1B4F8A" }} />
              Todos os Trials Ativos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: "#1e2535" }}>
                  {["Tenant", "Dias restantes", "Expira em", "Criado em"].map(h => (
                    <TableHead key={h} style={{ color: "#64748b" }}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {subsQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8" style={{ color: "#64748b" }}>Carregando…</TableCell>
                  </TableRow>
                ) : trials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8" style={{ color: "#64748b" }}>
                      Nenhum trial ativo
                    </TableCell>
                  </TableRow>
                ) : trials.map((s: any) => {
                  const days = daysLeft(s.trialEndsAt);
                  return (
                    <TableRow key={s.id} style={{ borderColor: "#1e2535" }}>
                      <TableCell className="text-white font-medium">{s.tenantName || `#${s.tenantId}`}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {days <= 3 ? (
                            <AlertCircle className="w-3.5 h-3.5" style={{ color: "#eab308" }} />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#22c55e" }} />
                          )}
                          <span style={{ color: days <= 3 ? "#eab308" : "#22c55e" }}>
                            {days} dia{days !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell style={{ color: "#94a3b8" }}>
                        {s.trialEndsAt ? new Date(s.trialEndsAt).toLocaleDateString("pt-BR") : "—"}
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
      </div>
    </CoreLayout>
  );
}
