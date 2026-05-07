/**
 * SuperAdminLogin.tsx — Tela de acesso dedicada ao painel de gestão da plataforma.
 * Usa OAuth Manus (não o formulário de tenant) para garantir tenantId=null no contexto.
 */
import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Loader2, ShieldCheck, Lock } from "lucide-react";

/** Gera a URL de login OAuth Manus com returnPath=/super-admin */
function getSuperAdminLoginUrl(): string {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  // O callback sempre aponta para a origem atual; após o callback o server redireciona para "/"
  // mas vamos usar o state para carregar o returnPath correto
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  // Codificamos o returnPath no state para que o callback redirecione para /super-admin
  const statePayload = btoa(JSON.stringify({ redirectUri, returnPath: "/super-admin" }));
  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", statePayload);
  url.searchParams.set("type", "signIn");
  return url.toString();
}

export default function SuperAdminLogin() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  // Se já está autenticado como platform admin, redireciona direto
  useEffect(() => {
    if (loading) return;
    if (user && (user as any).isPlatformAdmin) {
      navigate("/super-admin");
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A1628" }}>
        <Loader2 className="w-6 h-6 animate-spin text-[#1B6FD8]" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "#0A1628" }}
    >
      {/* Grid decorativo */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="sa-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#sa-grid)" />
      </svg>

      {/* Linha diagonal decorativa */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.05] pointer-events-none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        {[...Array(8)].map((_, i) => (
          <line key={i} x1={`${i * 15 - 10}%`} y1="0%" x2={`${i * 15 + 40}%`} y2="100%" stroke="#1B6FD8" strokeWidth="1" />
        ))}
      </svg>

      {/* Barra lateral esquerda */}
      <div className="absolute left-0 top-0 h-full w-1" style={{ background: "linear-gradient(to bottom, transparent, #1B6FD8, transparent)" }} />

      {/* Card central */}
      <div
        className="relative z-10 w-full max-w-sm mx-4 rounded-none border"
        style={{ background: "#0d1e35", borderColor: "rgba(27,111,216,0.2)" }}
      >
        {/* Cantos angulares */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2" style={{ borderColor: "#1B6FD8" }} />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2" style={{ borderColor: "#1B6FD8" }} />

        <div className="p-10 flex flex-col items-center gap-6">
          {/* Ícone de escudo */}
          <div
            className="w-16 h-16 flex items-center justify-center rounded-none"
            style={{ background: "rgba(27,111,216,0.12)", border: "1px solid rgba(27,111,216,0.3)" }}
          >
            <ShieldCheck className="w-8 h-8" style={{ color: "#1B6FD8" }} />
          </div>

          {/* Título */}
          <div className="text-center">
            <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: "#1B6FD8" }}>
              ▸ Área Restrita
            </p>
            <h1 className="text-xl font-bold text-white mb-1">Painel de Gestão</h1>
            <p className="text-sm" style={{ color: "#64748b" }}>
              Acesso exclusivo para administradores da plataforma Assist-Pró.
            </p>
          </div>

          {/* Separador */}
          <div className="w-full h-px" style={{ background: "rgba(27,111,216,0.15)" }} />

          {/* Botão OAuth */}
          <a
            href={getSuperAdminLoginUrl()}
            className="w-full flex items-center justify-center gap-3 py-3 px-6 font-semibold text-sm text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #1B6FD8 0%, #1558b0 100%)", borderRadius: 0 }}
          >
            <Lock className="w-4 h-4" />
            Entrar com conta Manus
          </a>

          {/* Rodapé */}
          <p className="text-xs text-center" style={{ color: "#334155" }}>
            Autenticação segura via OAuth 2.0 · Manus Platform
          </p>
        </div>
      </div>
    </div>
  );
}
