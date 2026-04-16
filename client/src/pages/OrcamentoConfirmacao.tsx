/**
 * OrcamentoConfirmacao.tsx
 * Páginas públicas de confirmação após aprovação/rejeição de orçamento via e-mail.
 * Rotas:
 *   /orcamento/aprovado?token=XXX
 *   /orcamento/rejeitado?token=XXX
 *   /orcamento/rejeitar?token=XXX   ← formulário de motivo
 *   /orcamento/erro?msg=XXX
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, XCircle, AlertTriangle, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getQueryParam(key: string): string {
  return new URLSearchParams(window.location.search).get(key) ?? "";
}

interface OsInfo {
  numero: string;
  statusOrcamento: string;
  valorTotal: number;
  tenantNome: string;
  clienteNome: string;
  equipamento: string;
}

function useOsInfo(token: string) {
  const [info, setInfo] = useState<OsInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch(`/api/orcamento/info?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => { setInfo(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  return { info, loading };
}

// ─── Layout base ─────────────────────────────────────────────────────────────

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-[#1B4F8A] px-8 py-5">
          <p className="text-white font-bold text-lg tracking-tight">⚡ Assist-Pró</p>
          <p className="text-blue-200 text-xs mt-0.5">Gestão para assistências técnicas</p>
        </div>
        <div className="px-8 py-8">{children}</div>
      </div>
    </div>
  );
}

// ─── Página: Aprovado ─────────────────────────────────────────────────────────

export function OrcamentoAprovado() {
  const token = getQueryParam("token");
  const jaRespondido = getQueryParam("ja_respondido") === "1";
  const { info, loading } = useOsInfo(token);

  return (
    <PageWrapper>
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-9 h-9 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          {jaRespondido ? "Orçamento já aprovado" : "Orçamento aprovado!"}
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          {jaRespondido
            ? "Você já havia aprovado este orçamento anteriormente. A assistência técnica já está ciente."
            : "Ótimo! Sua aprovação foi registrada com sucesso. A assistência técnica já foi notificada e em breve entrará em contato para confirmar o início do serviço."}
        </p>

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando detalhes...
          </div>
        )}

        {info && (
          <div className="w-full bg-slate-50 rounded-xl p-4 text-left mb-6 space-y-3">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">OS</p>
              <p className="text-base font-bold text-[#1B4F8A]">{info.numero}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Equipamento</p>
              <p className="text-sm font-medium text-slate-700">{info.equipamento}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Assistência</p>
              <p className="text-sm text-slate-600">{info.tenantNome}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Valor aprovado</p>
              <p className="text-xl font-bold text-green-600">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(info.valorTotal ?? 0)}
              </p>
            </div>
          </div>
        )}

        <p className="text-xs text-slate-400">Você pode fechar esta janela.</p>
      </div>
    </PageWrapper>
  );
}

// ─── Página: Rejeitado ────────────────────────────────────────────────────────

export function OrcamentoRejeitado() {
  const token = getQueryParam("token");
  const jaRespondido = getQueryParam("ja_respondido") === "1";
  const { info, loading } = useOsInfo(token);

  return (
    <PageWrapper>
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <XCircle className="w-9 h-9 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          {jaRespondido ? "Orçamento já rejeitado" : "Orçamento rejeitado"}
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          {jaRespondido
            ? "Você já havia rejeitado este orçamento anteriormente."
            : "Sua resposta foi registrada. A assistência técnica foi notificada e entrará em contato para combinar a devolução do equipamento."}
        </p>

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando detalhes...
          </div>
        )}

        {info && (
          <div className="w-full bg-slate-50 rounded-xl p-4 text-left mb-6 space-y-3">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">OS</p>
              <p className="text-base font-bold text-[#1B4F8A]">{info.numero}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Equipamento</p>
              <p className="text-sm font-medium text-slate-700">{info.equipamento}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Assistência</p>
              <p className="text-sm text-slate-600">{info.tenantNome}</p>
            </div>
          </div>
        )}

        <p className="text-xs text-slate-400">Você pode fechar esta janela.</p>
      </div>
    </PageWrapper>
  );
}

// ─── Página: Formulário de rejeição (quando motivo não veio na URL) ───────────

export function OrcamentoRejeitar() {
  const token = getQueryParam("token");
  const { info, loading } = useOsInfo(token);
  const [motivo, setMotivo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [, navigate] = useLocation();

  async function handleRejeitar() {
    if (motivo.trim().length < 5) {
      toast.error("Por favor, informe o motivo com pelo menos 5 caracteres.");
      return;
    }
    setSubmitting(true);
    try {
      const url = `/api/orcamento/rejeitar?token=${encodeURIComponent(token)}&motivo=${encodeURIComponent(motivo.trim())}`;
      // Usar fetch para não redirecionar o browser — processar a resposta
      const res = await fetch(url, { redirect: "manual" });
      // Redirecionar para a página de confirmação
      navigate(`/orcamento/rejeitado?token=${token}`);
    } catch {
      toast.error("Erro ao registrar rejeição. Tente novamente.");
      setSubmitting(false);
    }
  }

  return (
    <PageWrapper>
      <div className="flex flex-col">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4 mx-auto">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-1 text-center">Rejeitar orçamento</h1>
        <p className="text-slate-500 text-sm text-center mb-6">
          Informe o motivo para que a assistência técnica possa entrar em contato.
        </p>

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-4 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando...
          </div>
        )}

        {info && (
          <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-1">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">OS {info.numero}</p>
            <p className="text-sm font-medium text-slate-700">{info.equipamento}</p>
            <p className="text-lg font-bold text-slate-800">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(info.valorTotal ?? 0)}
            </p>
          </div>
        )}

        <div className="space-y-2 mb-6">
          <Label htmlFor="motivo" className="text-sm font-medium text-slate-700">
            Motivo da rejeição <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="motivo"
            placeholder="Ex: Valor acima do esperado, prefiro não reparar, vou buscar outro orçamento..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={4}
            maxLength={500}
            className="resize-none"
          />
          <p className="text-xs text-slate-400 text-right">{motivo.length}/500</p>
        </div>

        <Button
          onClick={handleRejeitar}
          disabled={submitting || motivo.trim().length < 5}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Registrando...</>
          ) : (
            <><ChevronRight className="w-4 h-4 mr-2" />Confirmar rejeição</>
          )}
        </Button>
      </div>
    </PageWrapper>
  );
}

// ─── Página: Erro ─────────────────────────────────────────────────────────────

const ERROR_MESSAGES: Record<string, string> = {
  token_invalido: "O link de aprovação é inválido ou está incompleto.",
  os_nao_encontrada: "A Ordem de Serviço não foi encontrada. O link pode estar desatualizado.",
  link_expirado: "Este link de aprovação expirou. Entre em contato com a assistência técnica.",
  servico_indisponivel: "O serviço está temporariamente indisponível. Tente novamente em alguns minutos.",
  erro_interno: "Ocorreu um erro interno. Por favor, entre em contato com a assistência técnica.",
};

export function OrcamentoErro() {
  const msg = getQueryParam("msg");
  const descricao = ERROR_MESSAGES[msg] ?? "Ocorreu um erro inesperado.";

  return (
    <PageWrapper>
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
          <AlertTriangle className="w-9 h-9 text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Não foi possível processar</h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">{descricao}</p>
        <p className="text-xs text-slate-400">
          Se o problema persistir, entre em contato diretamente com a assistência técnica.
        </p>
      </div>
    </PageWrapper>
  );
}
