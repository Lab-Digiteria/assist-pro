/**
 * Control Plane — Dashboard
 * Rota: /admin
 * Acesso exclusivo do dono da plataforma (role=admin).
 */
import { CoreLayout } from "@/components/CoreLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  Shield,
  Activity,
  Webhook,
  TrendingUp,
  CreditCard,
  Users,
  AlertCircle,
} from "lucide-react";

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  accent,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  accent?: string;
}) {
  return (
    <Card style={{ background: "#161b27", borderColor: "#1e2535" }}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium" style={{ color: "#94a3b8" }}>
          {title}
        </CardTitle>
        <Icon className="w-4 h-4" style={{ color: accent || "#1B4F8A" }} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
        {description && (
          <p className="text-xs mt-1" style={{ color: "#64748b" }}>
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  trialing: { label: "Período de trial ativo", color: "#3b82f6" },
  active: { label: "Assinatura paga e ativa", color: "#22c55e" },
  past_due: { label: "Pagamento em atraso", color: "#eab308" },
  suspended: { label: "Acesso suspenso", color: "#f97316" },
  canceled: { label: "Cancelada (terminal)", color: "#ef4444" },
  expired: { label: "Expirada (terminal)", color: "#6b7280" },
};

const S2S_ENDPOINTS = [
  { method: "POST", path: "/api/internal/auth/validate", desc: "Valida JWT e retorna claims" },
  { method: "POST", path: "/api/internal/entitlements/resolve", desc: "Retorna entitlements efetivos" },
  { method: "POST", path: "/api/internal/tenant/status", desc: "Status da assinatura do tenant" },
  { method: "POST", path: "/api/internal/audit-logs", desc: "Recebe logs do Produto" },
];

export default function AdminDashboard() {
  const statsQuery = trpc.tenants.adminStats.useQuery();
  const webhooksQuery = trpc.tenants.adminListWebhooks.useQuery();

  const stats = statsQuery.data;

  return (
    <CoreLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Tenants Ativos"
            value={statsQuery.isLoading ? "…" : (stats?.activeTenants ?? 0)}
            icon={Building2}
            description="Organizações provisionadas"
          />
          <StatCard
            title="Endpoints S2S"
            value={S2S_ENDPOINTS.length}
            icon={Shield}
            description="/validate, /resolve, /status"
            accent="#C4733A"
          />
          <StatCard
            title="Eventos de Auditoria"
            value={statsQuery.isLoading ? "…" : (stats?.totalWebhooksProcessed ?? 0)}
            icon={Activity}
            description="Últimas 50 entradas"
            accent="#E8C547"
          />
          <StatCard
            title="Webhooks"
            value="HMAC-SHA256"
            icon={Webhook}
            description="Com retry exponencial"
            accent="#22c55e"
          />
        </div>

        {/* Subscription states + S2S endpoints */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card style={{ background: "#161b27", borderColor: "#1e2535" }}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-white">
                <TrendingUp className="w-4 h-4" style={{ color: "#1B4F8A" }} />
                Estados de Assinatura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
                  <div key={status} className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: cfg.color }}
                    />
                    <code className="text-xs font-mono w-20" style={{ color: "#1B4F8A" }}>
                      {status}
                    </code>
                    <span className="text-xs" style={{ color: "#94a3b8" }}>
                      {cfg.label}
                    </span>
                    {stats?.statusCounts?.[status] !== undefined && (
                      <span
                        className="ml-auto text-xs font-semibold"
                        style={{ color: cfg.color }}
                      >
                        {stats.statusCounts[status]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card style={{ background: "#161b27", borderColor: "#1e2535" }}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-white">
                <CreditCard className="w-4 h-4" style={{ color: "#1B4F8A" }} />
                Endpoints S2S Internos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {S2S_ENDPOINTS.map((ep) => (
                  <div key={ep.path} className="flex items-start gap-3">
                    <span
                      className="text-xs font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{ background: "rgba(27,79,138,0.15)", color: "#1B4F8A" }}
                    >
                      {ep.method}
                    </span>
                    <div>
                      <code className="text-xs font-mono text-white">{ep.path}</code>
                      <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                        {ep.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card style={{ background: "#161b27", borderColor: "#1e2535" }}>
            <CardContent className="pt-4">
              <p className="text-xs mb-1" style={{ color: "#64748b" }}>Total Tenants</p>
              <p className="text-xl font-bold text-white">{stats?.totalTenants ?? "…"}</p>
            </CardContent>
          </Card>
          <Card style={{ background: "#161b27", borderColor: "#1e2535" }}>
            <CardContent className="pt-4">
              <p className="text-xs mb-1" style={{ color: "#64748b" }}>Em Trial</p>
              <p className="text-xl font-bold" style={{ color: "#3b82f6" }}>
                {stats?.trialingTenants ?? "…"}
              </p>
            </CardContent>
          </Card>
          <Card style={{ background: "#161b27", borderColor: "#1e2535" }}>
            <CardContent className="pt-4">
              <p className="text-xs mb-1" style={{ color: "#64748b" }}>Leads Capturados</p>
              <p className="text-xl font-bold" style={{ color: "#C4733A" }}>
                {stats?.totalLeads ?? "…"}
              </p>
            </CardContent>
          </Card>
          <Card style={{ background: "#161b27", borderColor: "#1e2535" }}>
            <CardContent className="pt-4">
              <p className="text-xs mb-1" style={{ color: "#64748b" }}>Suspensos/Cancelados</p>
              <p className="text-xl font-bold" style={{ color: "#ef4444" }}>
                {stats ? (stats.suspendedTenants + stats.canceledTenants) : "…"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent webhook events */}
        {webhooksQuery.data && webhooksQuery.data.length > 0 && (
          <Card style={{ background: "#161b27", borderColor: "#1e2535" }}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-white">
                <Activity className="w-4 h-4" style={{ color: "#1B4F8A" }} />
                Atividade Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {webhooksQuery.data.slice(-10).reverse().map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                    style={{ borderColor: "#1e2535" }}
                  >
                    <div className="flex items-center gap-3">
                      <code className="text-xs font-mono" style={{ color: "#1B4F8A" }}>
                        {ev.eventType}
                      </code>
                      <span className="text-xs" style={{ color: "#64748b" }}>
                        {ev.eventId.slice(0, 12)}…
                      </span>
                    </div>
                    <span className="text-xs" style={{ color: "#64748b" }}>
                      {new Date(ev.processedAt).toLocaleString("pt-BR")}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </CoreLayout>
  );
}
