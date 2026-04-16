import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Handshake, Phone, Mail, MapPin, Briefcase,
  CheckCircle, XCircle, Clock, RefreshCw,
} from "lucide-react";

const ATUACAO_LABELS: Record<string, string> = {
  consultor_ti: "Consultor de TI",
  revendedor_software: "Revendedor de Software",
  assistencia_tecnica: "Assistência Técnica",
  agencia_marketing: "Agência de Marketing",
  outro: "Outro",
};

const STATUS_CONFIG = {
  pendente: { label: "Pendente", color: "#E8C547", bg: "rgba(232,197,71,0.12)", icon: Clock },
  ativo: { label: "Ativo", color: "#22c55e", bg: "rgba(34,197,94,0.12)", icon: CheckCircle },
  inativo: { label: "Inativo", color: "#6b7280", bg: "rgba(107,114,128,0.12)", icon: XCircle },
};

type StatusFilter = "todos" | "pendente" | "ativo" | "inativo";

export default function AdminRevendedores() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");

  const { data: revendedores, isLoading, refetch } = trpc.revendedores.list.useQuery(
    { status: statusFilter },
    { refetchOnWindowFocus: false }
  );

  const updateStatus = trpc.revendedores.updateStatus.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`Status atualizado para "${STATUS_CONFIG[vars.status].label}"`);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const counts = {
    todos: revendedores?.length ?? 0,
    pendente: revendedores?.filter(r => r.status === "pendente").length ?? 0,
    ativo: revendedores?.filter(r => r.status === "ativo").length ?? 0,
    inativo: revendedores?.filter(r => r.status === "inativo").length ?? 0,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(232,197,71,0.12)" }}>
            <Handshake className="w-5 h-5" style={{ color: "#E8C547" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Programa de Revendedores</h1>
            <p className="text-sm text-gray-500">Gerencie os leads de interesse de revendas</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 border-white/10 text-gray-400 hover:text-white">
          <RefreshCw className="w-3.5 h-3.5" /> Atualizar
        </Button>
      </div>

      {/* Filtros por status */}
      <div className="flex gap-2 flex-wrap">
        {(["todos", "pendente", "ativo", "inativo"] as StatusFilter[]).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: statusFilter === s ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
              color: statusFilter === s ? "#fff" : "#6b7280",
              border: `1px solid ${statusFilter === s ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)"}`,
            }}
          >
            {s === "todos" ? "Todos" : STATUS_CONFIG[s].label}
            <span className="ml-2 px-1.5 py-0.5 rounded text-xs" style={{ background: "rgba(255,255,255,0.08)" }}>
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      ) : !revendedores?.length ? (
        <div className="text-center py-16 rounded-xl" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}>
          <Handshake className="w-10 h-10 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 font-medium">Nenhum revendedor encontrado</p>
          <p className="text-sm text-gray-600 mt-1">Os cadastros da landing page aparecerão aqui.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {revendedores.map(rev => {
            const sc = STATUS_CONFIG[rev.status];
            const StatusIcon = sc.icon;
            return (
              <div key={rev.id} className="p-5 rounded-xl" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="font-semibold text-white">{rev.nome}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: sc.bg, color: sc.color }}>
                        <StatusIcon className="w-3 h-3" />
                        {sc.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: "rgba(255,255,255,0.06)", color: "#9ca3af" }}>
                        {ATUACAO_LABELS[rev.atuacao] ?? rev.atuacao}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm" style={{ color: "#6b7280" }}>
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" /> {rev.email}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" /> {rev.whatsapp}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" /> {rev.cidade}/{rev.estado}
                      </span>
                    </div>

                    {rev.mensagem && (
                      <p className="mt-2 text-sm italic" style={{ color: "#9ca3af" }}>
                        "{rev.mensagem}"
                      </p>
                    )}

                    <p className="mt-2 text-xs" style={{ color: "#4b5563" }}>
                      Cadastrado em {new Date(rev.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2 flex-shrink-0">
                    <a
                      href={`https://wa.me/55${rev.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}
                    >
                      WhatsApp
                    </a>
                    {rev.status !== "ativo" && (
                      <Button size="sm" variant="outline" className="text-xs border-white/10 text-gray-300 hover:text-white h-7"
                        disabled={updateStatus.isPending}
                        onClick={() => updateStatus.mutate({ id: rev.id, status: "ativo" })}>
                        Ativar
                      </Button>
                    )}
                    {rev.status !== "inativo" && (
                      <Button size="sm" variant="outline" className="text-xs border-white/10 text-gray-500 h-7"
                        disabled={updateStatus.isPending}
                        onClick={() => updateStatus.mutate({ id: rev.id, status: "inativo" })}>
                        Inativar
                      </Button>
                    )}
                    {rev.status !== "pendente" && (
                      <Button size="sm" variant="outline" className="text-xs border-white/10 text-gray-500 h-7"
                        disabled={updateStatus.isPending}
                        onClick={() => updateStatus.mutate({ id: rev.id, status: "pendente" })}>
                        Pendente
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
