import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Zap, Copy, Check, TrendingUp, Users, DollarSign,
  MousePointer, LogOut, ExternalLink, ChevronRight,
  Clock, CheckCircle, XCircle, BarChart3, Link2,
} from "lucide-react";

const ATUACAO_LABELS: Record<string, string> = {
  consultor_ti: "Consultor de TI",
  revendedor_software: "Revendedor de Software",
  assistencia_tecnica: "Assistência Técnica",
  agencia_marketing: "Agência de Marketing",
  outro: "Outro",
};

const STATUS_CONV: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  pending: { label: "Pendente", color: "#E8C547", icon: Clock },
  confirmed: { label: "Confirmado", color: "#22c55e", icon: CheckCircle },
  cancelled: { label: "Cancelado", color: "#ef4444", icon: XCircle },
};

const STATUS_COMM: Record<string, { label: string; color: string }> = {
  pending: { label: "Aguardando pagamento", color: "#E8C547" },
  paid: { label: "Pago", color: "#22c55e" },
  cancelled: { label: "Cancelado", color: "#ef4444" },
};

type Tab = "overview" | "conversions" | "commissions";

export default function RevendedorDashboard() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("overview");
  const [copied, setCopied] = useState(false);

  const { data: me, isLoading: loadingMe, error: meError } = trpc.revendedores.me.useQuery(undefined, {
    retry: false,
  });
  if (meError) navigate("/revendedor/login");
  const { data: dashboard } = trpc.revendedores.dashboard.useQuery(undefined, { enabled: !!me });
  const { data: conversions } = trpc.revendedores.conversions.useQuery(undefined, { enabled: tab === "conversions" && !!me });
  const { data: commissions } = trpc.revendedores.commissions.useQuery(undefined, { enabled: tab === "commissions" && !!me });

  const logout = trpc.revendedores.logout.useMutation({
    onSuccess: () => navigate("/revendedor/login"),
  });

  const referralUrl = me?.referralCode
    ? `${window.location.origin}/?ref=${me.referralCode}`
    : null;

  const copyLink = () => {
    if (!referralUrl) return;
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loadingMe) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0a" }}>
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!me) return null;

  const tabs: { id: Tab; label: string; icon: typeof BarChart3 }[] = [
    { id: "overview", label: "Visão Geral", icon: BarChart3 },
    { id: "conversions", label: "Conversões", icon: Users },
    { id: "commissions", label: "Comissões", icon: DollarSign },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a" }}>
      {/* Header */}
      <header className="border-b sticky top-0 z-50" style={{ background: "#0d0d0d", borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #1B4F8A, #2563EB)" }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-white">Assist-Pró</span>
            <span className="text-gray-600 text-sm hidden sm:block">/ Portal do Revendedor</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-white">{me.nome}</div>
              <div className="text-xs text-gray-500">{ATUACAO_LABELS[me.atuacao] ?? me.atuacao}</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout.mutate()}
              className="text-gray-400 hover:text-white gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Link de indicação */}
        {referralUrl && (
          <div className="rounded-2xl p-6 border" style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.15), rgba(27,79,138,0.1))", borderColor: "rgba(37,99,235,0.3)" }}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-400 font-semibold text-sm">Seu link de indicação</span>
                </div>
                <p className="text-white font-mono text-sm truncate mb-1">{referralUrl}</p>
                <p className="text-gray-400 text-xs">Compartilhe este link. Cada cliente que assinar através dele gera comissão para você.</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={copyLink}
                  className="gap-2 font-semibold"
                  style={{ background: copied ? "#22c55e" : "#2563EB" }}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copiado!" : "Copiar link"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(referralUrl, "_blank")}
                  className="border-white/10 text-gray-300 hover:text-white"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
              <span className="text-gray-400 text-xs">Código:</span>
              <span className="text-yellow-400 font-mono font-bold tracking-widest">{me.referralCode}</span>
              <span className="text-gray-600 text-xs ml-4">Comissão:</span>
              <span className="text-green-400 font-bold text-sm">{me.commissionRate ?? "20"}% recorrente</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "#141414" }}>
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  tab === t.id ? "text-white" : "text-gray-500 hover:text-gray-300"
                }`}
                style={tab === t.id ? { background: "#1a1a1a", boxShadow: "0 1px 3px rgba(0,0,0,0.4)" } : {}}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab: Visão Geral */}
        {tab === "overview" && dashboard && (
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Cliques no link", value: dashboard.totalClicks, icon: MousePointer, color: "#2563EB" },
                { label: "Conversões totais", value: dashboard.totalConversions, icon: Users, color: "#8b5cf6" },
                { label: "Confirmadas", value: dashboard.confirmedConversions, icon: CheckCircle, color: "#22c55e" },
                { label: "Comissão pendente", value: `R$ ${dashboard.pendingCommission.toFixed(2).replace(".", ",")}`, icon: DollarSign, color: "#E8C547" },
              ].map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <div key={kpi.label} className="rounded-xl p-5 border" style={{ background: "#141414", borderColor: "rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-400 text-xs font-medium">{kpi.label}</span>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}20` }}>
                        <Icon className="w-4 h-4" style={{ color: kpi.color }} />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-white">{kpi.value}</div>
                  </div>
                );
              })}
            </div>

            {/* Total acumulado */}
            <div className="rounded-xl p-6 border" style={{ background: "#141414", borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <h3 className="text-white font-semibold">Resumo financeiro</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg" style={{ background: "#1a1a1a" }}>
                  <div className="text-3xl font-black text-green-400">
                    R$ {dashboard.totalCommission.toFixed(2).replace(".", ",")}
                  </div>
                  <div className="text-gray-400 text-sm mt-1">Total acumulado</div>
                </div>
                <div className="text-center p-4 rounded-lg" style={{ background: "#1a1a1a" }}>
                  <div className="text-3xl font-black text-yellow-400">
                    R$ {dashboard.pendingCommission.toFixed(2).replace(".", ",")}
                  </div>
                  <div className="text-gray-400 text-sm mt-1">Aguardando pagamento</div>
                </div>
                <div className="text-center p-4 rounded-lg" style={{ background: "#1a1a1a" }}>
                  <div className="text-3xl font-black text-blue-400">
                    {dashboard.commissionRate ?? "20"}%
                  </div>
                  <div className="text-gray-400 text-sm mt-1">Sua taxa de comissão</div>
                </div>
              </div>
            </div>

            {/* Instruções */}
            <div className="rounded-xl p-6 border" style={{ background: "#141414", borderColor: "rgba(255,255,255,0.06)" }}>
              <h3 className="text-white font-semibold mb-4">Como funciona</h3>
              <div className="space-y-3">
                {[
                  { step: "1", text: "Compartilhe seu link de indicação com assistências técnicas da sua região" },
                  { step: "2", text: "Quando alguém se cadastrar pelo seu link e assinar um plano, a conversão é registrada automaticamente" },
                  { step: "3", text: "Você recebe comissão recorrente enquanto o cliente estiver ativo — todo mês" },
                  { step: "4", text: "O pagamento é processado mensalmente pela equipe do Assist-Pró" },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                      style={{ background: "#2563EB" }}>{item.step}</div>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Conversões */}
        {tab === "conversions" && (
          <div className="rounded-xl border overflow-hidden" style={{ background: "#141414", borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="p-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <h3 className="text-white font-semibold">Histórico de conversões</h3>
              <p className="text-gray-500 text-sm mt-1">Clientes que se cadastraram pelo seu link</p>
            </div>
            {!conversions || conversions.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">Nenhuma conversão ainda</p>
                <p className="text-gray-600 text-sm mt-1">Compartilhe seu link para começar a ganhar comissões</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {conversions.map((conv) => {
                  const s = STATUS_CONV[conv.status] ?? STATUS_CONV.pending;
                  const Icon = s.icon;
                  return (
                    <div key={conv.id} className="p-5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                          style={{ background: "#1a1a1a" }}>
                          {(conv.tenantNome ?? "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm">{conv.tenantNome ?? "—"}</div>
                          <div className="text-gray-500 text-xs">{conv.tenantEmail ?? "—"}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {conv.planName && (
                          <span className="text-gray-400 text-xs hidden sm:block">{conv.planName}</span>
                        )}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{ background: `${s.color}18`, color: s.color }}>
                          <Icon className="w-3 h-3" />
                          {s.label}
                        </div>
                        <div className="text-gray-500 text-xs hidden sm:block">
                          {new Date(conv.createdAt!).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab: Comissões */}
        {tab === "commissions" && (
          <div className="rounded-xl border overflow-hidden" style={{ background: "#141414", borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="p-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <h3 className="text-white font-semibold">Extrato de comissões</h3>
              <p className="text-gray-500 text-sm mt-1">Comissões mensais geradas pelas suas indicações</p>
            </div>
            {!commissions || commissions.length === 0 ? (
              <div className="p-12 text-center">
                <DollarSign className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">Nenhuma comissão ainda</p>
                <p className="text-gray-600 text-sm mt-1">As comissões aparecem aqui após a confirmação das assinaturas</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {commissions.map((comm) => {
                  const s = STATUS_COMM[comm.status] ?? STATUS_COMM.pending;
                  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
                  const mes = meses[(comm.periodoMes ?? 1) - 1];
                  return (
                    <div key={comm.id} className="p-5 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-white font-semibold">{mes}/{comm.periodoAno}</div>
                        <div className="text-gray-500 text-xs mt-0.5">{comm.totalConversions} conversão(ões) ativa(s)</div>
                        {comm.observacoes && (
                          <div className="text-gray-600 text-xs mt-1">{comm.observacoes}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg font-black text-white">
                            R$ {parseFloat(comm.totalValue ?? "0").toFixed(2).replace(".", ",")}
                          </div>
                          {comm.paidAt && (
                            <div className="text-gray-500 text-xs">
                              Pago em {new Date(comm.paidAt).toLocaleDateString("pt-BR")}
                            </div>
                          )}
                        </div>
                        <div className="px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{ background: `${s.color}18`, color: s.color }}>
                          {s.label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
