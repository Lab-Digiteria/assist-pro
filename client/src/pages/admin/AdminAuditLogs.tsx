/**
 * Control Plane — Audit Logs
 * Rota: /admin/audit-logs
 */
import { CoreLayout } from "@/components/CoreLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminAuditLogs() {
  const webhooksQuery = trpc.tenants.adminListWebhooks.useQuery();
  const utils = trpc.useUtils();

  return (
    <CoreLayout title="Audit Logs">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => utils.tenants.adminListWebhooks.invalidate()}
            style={{ borderColor: "#1e2535", color: "#94a3b8", background: "transparent" }}>
            <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
          </Button>
        </div>
        <Card style={{ background: "#161b27", borderColor: "#1e2535" }}>
          <CardHeader>
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Activity className="w-4 h-4" style={{ color: "#1B4F8A" }} />
              Eventos Stripe Processados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: "#1e2535" }}>
                  {["ID", "Tipo do Evento", "Event ID", "Processado em"].map(h => (
                    <TableHead key={h} style={{ color: "#64748b" }}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooksQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8" style={{ color: "#64748b" }}>Carregando…</TableCell>
                  </TableRow>
                ) : (webhooksQuery.data ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8" style={{ color: "#64748b" }}>
                      Nenhum evento registrado ainda
                    </TableCell>
                  </TableRow>
                ) : [...(webhooksQuery.data ?? [])].reverse().map((ev: any) => (
                  <TableRow key={ev.id} style={{ borderColor: "#1e2535" }}>
                    <TableCell style={{ color: "#64748b" }} className="font-mono text-xs">{ev.id}</TableCell>
                    <TableCell>
                      <code className="text-xs font-mono px-1.5 py-0.5 rounded"
                        style={{ background: "rgba(27,79,138,0.15)", color: "#1B4F8A" }}>
                        {ev.eventType}
                      </code>
                    </TableCell>
                    <TableCell style={{ color: "#64748b" }} className="font-mono text-xs">
                      {ev.eventId.slice(0, 20)}…
                    </TableCell>
                    <TableCell style={{ color: "#64748b" }}>
                      {new Date(ev.processedAt).toLocaleString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </CoreLayout>
  );
}
