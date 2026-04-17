import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  AlertTriangle,
  Box,
  ClipboardList,
  Clock,
  TrendingUp,
  Wrench,
  ArrowRight,
} from "lucide-react";
import { OS_STATUS_LABELS, FORMA_PAGAMENTO_LABELS } from "../../../shared/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function MetricCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  sub?: string;
}) {
  return (
    <div className="metric-card">
      <div className="metric-icon" style={{ background: iconBg }}>
        <Icon size={18} style={{ color: iconColor }} />
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
      {sub && <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{sub}</div>}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="metric-card">
      <div className="skeleton w-10 h-10 rounded-lg mb-3" />
      <div className="skeleton w-20 h-7 rounded mb-2" />
      <div className="skeleton w-28 h-4 rounded" />
    </div>
  );
}

const STATUS_DISPLAY = [
  { key: "recebido", label: "Recebido", color: "#3b82f6" },
  { key: "em_diagnostico", label: "Diagnóstico", color: "#e8c547" },
  { key: "aguardando_aprovacao", label: "Aguard. Aprovação", color: "#c4733a" },
  { key: "em_reparo", label: "Em Reparo", color: "#f97316" },
  { key: "concluido", label: "Concluído", color: "#22c55e" },
  { key: "pronto_aguardando_retirada", label: "Aguard. Retirada", color: "#8b5cf6" },
  { key: "encerrado", label: "Encerrado", color: "#6b7280" },
  { key: "cancelado", label: "Cancelado", color: "#ef4444" },
];

export default function Dashboard() {
  const { data, isLoading } = trpc.financeiro.dashboard.useQuery();
  const { data: faturamentoMensal } = trpc.financeiro.faturamentoMensal.useQuery();

  const alertas = data?.alertas;
  const totalAlertas =
    (alertas?.osVencidas.length ?? 0) +
    (alertas?.osAguardandoRetirada.length ?? 0) +
    (alertas?.pecasAbaixoMinimo.length ?? 0);

  // Build chart data from osPorStatus
  const chartData = STATUS_DISPLAY.filter((s) => (data?.osPorStatus?.[s.key] ?? 0) > 0).map((s) => ({
    name: s.label,
    total: data?.osPorStatus?.[s.key] ?? 0,
    fill: s.color,
  }));

  // Faturamento dos últimos 6 meses para o gráfico de barras
  const faturamentoChart = (faturamentoMensal ?? []).slice(-6).map((m: { label: string; valor: number }) => ({
    name: m.label,
    total: m.valor,
  }));

  return (
    <AppLayout title="Dashboard" subtitle="Visão geral da sua assistência técnica">
      <div className="space-y-5">

        {/* ── 4 Metric Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              <MetricCard
                label="OS em Aberto"
                value={data?.performance.totalOsAbertas ?? 0}
                icon={ClipboardList}
                iconBg="rgba(27,79,138,0.2)"
                iconColor="#60a5fa"
              />
              <MetricCard
                label="Faturamento do Mês"
                value={formatCurrency(data?.financeiro.faturamentoMes ?? 0)}
                icon={TrendingUp}
                iconBg="rgba(34,197,94,0.15)"
                iconColor="#4ade80"
                sub={`Hoje: ${formatCurrency(data?.financeiro.faturamentoHoje ?? 0)}`}
              />
              <MetricCard
                label="Peças em Alerta"
                value={alertas?.pecasAbaixoMinimo.length ?? 0}
                icon={Box}
                iconBg="rgba(232,197,71,0.15)"
                iconColor="#fde68a"
                sub="Abaixo do mínimo"
              />
              <MetricCard
                label="Alertas Críticos"
                value={totalAlertas}
                icon={AlertTriangle}
                iconBg="rgba(239,68,68,0.15)"
                iconColor="#fca5a5"
                sub={`${alertas?.osVencidas.length ?? 0} OS vencidas`}
              />
            </>
          )}
        </div>

        {/* ── Main Content Grid ── */}
        <div className="grid lg:grid-cols-3 gap-4">

          {/* Left: Charts (2/3) */}
          <div className="lg:col-span-2 space-y-4">

            {/* Faturamento últimos 6 meses */}
            <div
              className="rounded-lg p-5"
              style={{ background: "var(--surface-1)", border: "1px solid var(--surface-border)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Faturamento — Últimos 6 meses
                </h3>
              </div>
              {isLoading ? (
                <div className="skeleton w-full h-48 rounded" />
              ) : faturamentoChart.length === 0 ? (
                <div className="flex items-center justify-center h-48" style={{ color: "var(--text-muted)" }}>
                  <span className="text-sm">Nenhum dado de faturamento ainda</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={faturamentoChart} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--surface-2)",
                        border: "1px solid var(--surface-border)",
                        borderRadius: 6,
                        fontSize: 12,
                        color: "var(--text-primary)",
                      }}
                      formatter={(v: number) => [formatCurrency(v), "Faturamento"]}
                    />
                    <Bar dataKey="total" fill="#1B4F8A" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* OS por Status */}
            <div
              className="rounded-lg p-5"
              style={{ background: "var(--surface-1)", border: "1px solid var(--surface-border)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  OS por Status
                </h3>
                <Link href="/ordens-servico" className="flex items-center gap-1 text-xs" style={{ color: "var(--brand-primary-light)" }}>
                  Ver todas <ArrowRight size={12} />
                </Link>
              </div>
              {isLoading ? (
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="skeleton h-16 rounded" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {STATUS_DISPLAY.map((s) => {
                    const count = data?.osPorStatus?.[s.key] ?? 0;
                    if (count === 0) return null;
                    return (
                      <div
                        key={s.key}
                        className="rounded-md p-3 text-center"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--surface-border)" }}
                      >
                        <div className="text-xl font-bold" style={{ color: s.color }}>{count}</div>
                        <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{s.label}</div>
                      </div>
                    );
                  })}
                  {Object.keys(data?.osPorStatus ?? {}).length === 0 && (
                    <div className="col-span-4 text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>
                      Nenhuma OS cadastrada ainda
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Alerts + Financeiro (1/3) */}
          <div className="space-y-4">

            {/* Alertas */}
            {(isLoading || totalAlertas > 0) && (
              <div
                className="rounded-lg p-4"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.25)",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={15} style={{ color: "#fca5a5" }} />
                  <span className="text-sm font-semibold" style={{ color: "#fca5a5" }}>
                    Alertas Críticos
                  </span>
                </div>
                {isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => <div key={i} className="skeleton h-8 rounded" />)}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(alertas?.osVencidas.length ?? 0) > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-1.5" style={{ color: "#fca5a5" }}>
                          OS com prazo vencido ({alertas?.osVencidas.length})
                        </p>
                        {alertas?.osVencidas.slice(0, 3).map((os) => (
                          <Link key={os.id} href={`/ordens-servico/${os.id}`}>
                            <div className="flex justify-between text-xs py-1.5 cursor-pointer hover:opacity-80" style={{ borderBottom: "1px solid rgba(239,68,68,0.15)" }}>
                              <span className="font-medium" style={{ color: "var(--text-secondary)" }}>{os.numero}</span>
                              <span style={{ color: "#fca5a5" }}>{os.diasAtraso}d atraso</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                    {(alertas?.osAguardandoRetirada.length ?? 0) > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-1.5" style={{ color: "#fde68a" }}>
                          Aguardando retirada ({alertas?.osAguardandoRetirada.length})
                        </p>
                        {alertas?.osAguardandoRetirada.slice(0, 3).map((os) => (
                          <Link key={os.id} href={`/ordens-servico/${os.id}`}>
                            <div className="flex justify-between text-xs py-1.5 cursor-pointer hover:opacity-80" style={{ borderBottom: "1px solid rgba(232,197,71,0.15)" }}>
                              <span className="font-medium" style={{ color: "var(--text-secondary)" }}>{os.numero}</span>
                              <span style={{ color: "#fde68a" }}>{os.diasEsperando}d esperando</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                    {(alertas?.pecasAbaixoMinimo.length ?? 0) > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-1.5" style={{ color: "#fdba74" }}>
                          Peças abaixo do mínimo ({alertas?.pecasAbaixoMinimo.length})
                        </p>
                        {alertas?.pecasAbaixoMinimo.slice(0, 3).map((p) => (
                          <div key={p.id} className="flex justify-between text-xs py-1.5" style={{ borderBottom: "1px solid rgba(196,115,58,0.15)" }}>
                            <span className="truncate font-medium" style={{ color: "var(--text-secondary)" }}>{p.nome}</span>
                            <span style={{ color: "#fdba74" }}>{p.quantidadeAtual}/{p.quantidadeMinima}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Financeiro resumo */}
            <div
              className="rounded-lg p-4"
              style={{ background: "var(--surface-1)", border: "1px solid var(--surface-border)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={15} style={{ color: "#4ade80" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Financeiro</span>
              </div>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <div key={i} className="skeleton h-8 rounded" />)}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2" style={{ borderBottom: "1px solid var(--surface-border)" }}>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Hoje</span>
                    <span className="text-sm font-bold" style={{ color: "#4ade80" }}>
                      {formatCurrency(data?.financeiro.faturamentoHoje ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2" style={{ borderBottom: "1px solid var(--surface-border)" }}>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Este mês</span>
                    <span className="text-sm font-bold" style={{ color: "#4ade80" }}>
                      {formatCurrency(data?.financeiro.faturamentoMes ?? 0)}
                    </span>
                  </div>
                  {Object.entries(data?.financeiro.breakdownPagamento ?? {}).map(([forma, valor]) => (
                    <div key={forma} className="flex justify-between items-center py-1">
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {FORMA_PAGAMENTO_LABELS[forma] ?? forma}
                      </span>
                      <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                        {formatCurrency(valor as number)}
                      </span>
                    </div>
                  ))}
                  {Object.keys(data?.financeiro.breakdownPagamento ?? {}).length === 0 && (
                    <p className="text-xs text-center py-2" style={{ color: "var(--text-muted)" }}>
                      Nenhum lançamento este mês
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Performance */}
            <div
              className="rounded-lg p-4"
              style={{ background: "var(--surface-1)", border: "1px solid var(--surface-border)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Wrench size={15} style={{ color: "#60a5fa" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Performance</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>OS em aberto</span>
                <span className="text-2xl font-bold" style={{ color: "#60a5fa" }}>
                  {isLoading ? <span className="skeleton inline-block w-8 h-7 rounded" /> : (data?.performance.totalOsAbertas ?? 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
