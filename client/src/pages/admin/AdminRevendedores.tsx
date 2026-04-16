import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Handshake, Phone, Mail, MapPin,
  CheckCircle, XCircle, Clock, RefreshCw, Key, Copy,
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
  const [activatingId, setActivatingId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const { data: revendedoresRaw, isLoading, refetch } = trpc.revendedores.adminList.useQuery(
    undefined,
    { refetchOnWindowFocus: false }
  );
  const revendedores = statusFilter === "todos"
    ? revendedoresRaw
    : revendedoresRaw?.filter(r => r.status === statusFilter);

  const updateStatus = trpc.revendedores.adminUpdateStatus.useMutation({
    onSuccess: (_: unknown, vars: { id: number; status: "pendente" | "ativo" | "inativo" }) => {
      toast.success(`Status atualizado para "${STATUS_CONFIG[vars.status].label}"`);
      refetch();
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const activateWithCredentials = trpc.revendedores.adminActivateWithCredentials.useMutation({
    onSuccess: (data: { ok: boolean; referralCode?: string }) => {
      toast.success(`Revendedor ativado! Código de referral: ${data.referralCode ?? "—"}`);
      setActivatingId(null);
      setNewPassword("");
      refetch();
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const counts = {
    todos: revendedoresRaw?.length ?? 0,
    pendente: revendedoresRaw?.filter(r => r.status === "pendente").length ?? 0,
    ativo: revendedoresRaw?.filter(r => r.status === "ativo").length ?? 0,
    inativo: revendedoresRaw?.filter(r => r.status === "inativo").length ?? 0,
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
            <p className="text-sm text-gray-500">Gerencie os leads e ative o acesso dos revendedores</p>
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
            const isActivating = activatingId === rev.id;
            return (
              <div key={rev.id} className="p-5 rounded-xl" style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Nome + status */}
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
                      {/* Código de referral */}
                      {(rev as any).referralCode && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono cursor-pointer"
                          style={{ background: "rgba(27,79,138,0.2)", color: "#60a5fa", border: "1px solid rgba(27,79,138,0.3)" }}
                          onClick={() => {
                            navigator.clipboard.writeText((rev as any).referralCode);
                            toast.success("Código copiado!");
                          }}
                          title="Clique para copiar"
                        >
                          <Copy className="w-3 h-3" />
                          {(rev as any).referralCode}
                        </span>
                      )}
                    </div>

                    {/* Contato */}
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

                    {/* Formulário de ativação com senha */}
                    {isActivating && (
                      <div className="mt-3 p-3 rounded-lg space-y-2" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <Label className="text-xs text-gray-400">Definir senha de acesso do revendedor</Label>
                        <div className="flex gap-2">
                          <Input
                            type="password"
                            placeholder="Senha (mín. 8 caracteres)"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="h-8 text-sm bg-transparent border-white/10 text-white"
                          />
                          <Button size="sm" className="text-xs bg-green-600 hover:bg-green-700 text-white whitespace-nowrap"
                            disabled={activateWithCredentials.isPending || newPassword.length < 8}
                            onClick={() => activateWithCredentials.mutate({
                              id: rev.id,
                              password: newPassword,
                              origin: window.location.origin,
                            })}>
                            <Key className="w-3.5 h-3.5 mr-1" />
                            Ativar e Enviar
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs border-white/10 text-gray-400"
                            onClick={() => { setActivatingId(null); setNewPassword(""); }}>
                            Cancelar
                          </Button>
                        </div>
                        <p className="text-xs text-gray-600">O revendedor receberá um e-mail com as credenciais de acesso e o código de referral.</p>
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <a
                      href={`https://wa.me/55${rev.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-center"
                      style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}
                    >
                      WhatsApp
                    </a>
                    {/* Botão Liberar Acesso (ativa + define senha + envia e-mail) */}
                    {rev.status !== "ativo" && !isActivating && (
                      <Button size="sm" variant="outline"
                        className="text-xs border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 h-7"
                        onClick={() => { setActivatingId(rev.id); setNewPassword(""); }}>
                        <Key className="w-3 h-3 mr-1" />
                        Liberar Acesso
                      </Button>
                    )}
                    {rev.status === "ativo" && !isActivating && (
                      <Button size="sm" variant="outline"
                        className="text-xs border-white/10 text-gray-400 h-7"
                        onClick={() => { setActivatingId(rev.id); setNewPassword(""); }}>
                        <Key className="w-3 h-3 mr-1" />
                        Redefinir Senha
                      </Button>
                    )}
                    {rev.status !== "inativo" && (
                      <Button size="sm" variant="outline" className="text-xs border-white/10 text-gray-500 h-7"
                        disabled={updateStatus.isPending}
                        onClick={() => updateStatus.mutate({ id: rev.id, status: "inativo" })}>
                        Inativar
                      </Button>
                    )}
                    {rev.status === "inativo" && (
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
