import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  DollarSign, CheckCircle, Clock, RefreshCw, TrendingUp,
  Handshake, Calendar, User,
} from "lucide-react";

const STATUS_CONFIG = {
  pending: { label: "Pendente", color: "#E8C547", bg: "rgba(232,197,71,0.12)", icon: Clock },
  paid: { label: "Pago", color: "#22c55e", bg: "rgba(34,197,94,0.12)", icon: CheckCircle },
};

const MONTH_NAMES = [
  "", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

type StatusFilter = "todos" | "pending" | "paid";

export default function AdminComissoes() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [obsMap, setObsMap] = useState<Record<number, string>>({});

  const { data: commissionsRaw, isLoading, refetch } = trpc.revendedores.adminListCommissions.useQuery(
    undefined,
    { refetchOnWindowFocus: false }
  );

  const approveCommission = trpc.revendedores.adminApproveCommission.useMutation({
    onSuccess: () => {
      toast.success("Comissão marcada como paga!");
      setApprovingId(null);
      refetch();
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const commissions = statusFilter === "todos"
    ? commissionsRaw
    : commissionsRaw?.filter(c => c.status === statusFilter);

  const totalPending = commissionsRaw?.filter(c => c.status === "pending").length ?? 0;
  const totalPaid = commissionsRaw?.filter(c => c.status === "paid").length ?? 0;
  const totalValuePending = commissionsRaw
    ?.filter(c => c.status === "pending")
    .reduce((acc, c) => acc + Number(c.totalValue), 0) ?? 0;
  const totalValuePaid = commissionsRaw
    ?.filter(c => c.status === "paid")
    .reduce((acc, c) => acc + Number(c.totalValue), 0) ?? 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(34,197,94,0.12)" }}>
            <DollarSign className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Comissões de Revendedores</h1>
            <p className="text-sm text-gray-500">Aprove e gerencie pagamentos de comissões</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}
          className="gap-2 border-white/10 text-gray-400 hover:text-white">
          <RefreshCw className="w-3.5 h-3.5" /> Atualizar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-xs text-gray-500 mb-1">Pendentes</p>
          <p className="text-2xl font-bold text-yellow-400">{totalPending}</p>
          <p className="text-xs text-gray-600 mt-1">comissões aguardando</p>
        </div>
        <div className="p-4 rounded-xl" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-xs text-gray-500 mb-1">Valor Pendente</p>
          <p className="text-2xl font-bold text-yellow-400">
            {totalValuePending.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
          <p className="text-xs text-gray-600 mt-1">a pagar</p>
        </div>
        <div className="p-4 rounded-xl" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-xs text-gray-500 mb-1">Pagas</p>
          <p className="text-2xl font-bold text-green-400">{totalPaid}</p>
          <p className="text-xs text-gray-600 mt-1">comissões liquidadas</p>
        </div>
        <div className="p-4 rounded-xl" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-xs text-gray-500 mb-1">Total Pago</p>
          <p className="text-2xl font-bold text-green-400">
            {totalValuePaid.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
          <p className="text-xs text-gray-600 mt-1">histórico</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {(["todos", "pending", "paid"] as StatusFilter[]).map(s => {
          const labels: Record<StatusFilter, string> = { todos: "Todos", pending: "Pendentes", paid: "Pagos" };
          const isActive = statusFilter === s;
          return (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: isActive ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
                color: isActive ? "#fff" : "#6b7280",
                border: `1px solid ${isActive ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)"}`,
              }}>
              {labels[s]}
            </button>
          );
        })}
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      ) : !commissions?.length ? (
        <div className="text-center py-16 rounded-xl"
          style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}>
          <TrendingUp className="w-10 h-10 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 font-medium">Nenhuma comissão encontrada</p>
          <p className="text-sm text-gray-600 mt-1">
            As comissões são geradas automaticamente quando um revendedor converte um lead.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {commissions.map(c => {
            const sc = STATUS_CONFIG[c.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
            const StatusIcon = sc.icon;
            const isExpanded = approvingId === c.id;
            return (
              <div key={c.id} className="p-5 rounded-xl"
                style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Revendedor + status */}
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <Handshake className="w-4 h-4 text-yellow-400" />
                        {c.revendedorNome}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: sc.bg, color: sc.color }}>
                        <StatusIcon className="w-3 h-3" />
                        {sc.label}
                      </span>
                    </div>
                    {/* Detalhes */}
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm" style={{ color: "#6b7280" }}>
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> {c.revendedorEmail}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {MONTH_NAMES[c.periodoMes]}/{c.periodoAno}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        {c.totalConversions} conversão(ões)
                      </span>
                    </div>
                    {/* Valor */}
                    <p className="mt-2 text-lg font-bold" style={{ color: c.status === "paid" ? "#22c55e" : "#E8C547" }}>
                      {Number(c.totalValue).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                    {c.paidAt && (
                      <p className="text-xs mt-1" style={{ color: "#4b5563" }}>
                        Pago em {new Date(c.paidAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    )}
                    {c.observacoes && (
                      <p className="mt-1 text-sm italic" style={{ color: "#9ca3af" }}>
                        Obs: {c.observacoes}
                      </p>
                    )}
                    {/* Formulário de aprovação expandido */}
                    {isExpanded && c.status === "pending" && (
                      <div className="mt-3 flex flex-col gap-2">
                        <textarea
                          placeholder="Observações sobre o pagamento (opcional)"
                          value={obsMap[c.id] ?? ""}
                          onChange={e => setObsMap(prev => ({ ...prev, [c.id]: e.target.value }))}
                          rows={2}
                          className="w-full rounded-lg px-3 py-2 text-sm resize-none"
                          style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" className="text-xs bg-green-600 hover:bg-green-700 text-white"
                            disabled={approveCommission.isPending}
                            onClick={() => approveCommission.mutate({ id: c.id, observacoes: obsMap[c.id] })}>
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Confirmar Pagamento
                          </Button>
                          <Button size="sm" variant="outline"
                            className="text-xs border-white/10 text-gray-400"
                            onClick={() => setApprovingId(null)}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Ação */}
                  {c.status === "pending" && !isExpanded && (
                    <Button size="sm" variant="outline"
                      className="text-xs border-green-500/30 text-green-400 hover:bg-green-500/10 flex-shrink-0"
                      onClick={() => setApprovingId(c.id)}>
                      <DollarSign className="w-3.5 h-3.5 mr-1" />
                      Marcar Pago
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
