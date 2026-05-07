/**
 * SuperAdminGuard — protege rotas /super-admin/* no frontend.
 *
 * Acesso permitido APENAS quando isPlatformAdmin=true no token JWT.
 * isPlatformAdmin é true somente quando:
 *   - role === "admin" (usuário da plataforma, não tenant)
 *   - tenantId === null (não é um tenant logado via JWT próprio)
 *   - isImpersonating === false (não está em modo impersonation)
 *
 * Tenants com qualquer role (manager, technician, viewer) são
 * redirecionados para /dashboard — nunca conseguem acessar esta área.
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, ShieldAlert } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

interface SuperAdminGuardProps {
  children: React.ReactNode;
}

export function SuperAdminGuard({ children }: SuperAdminGuardProps) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  // isPlatformAdmin vem do auth.me — true apenas para o dono da plataforma
  const isPlatformAdmin = (user as any)?.isPlatformAdmin === true;

  useEffect(() => {
    if (loading) return;
    if (!user) {
      // Não autenticado — redireciona para login dedicado do super-admin (OAuth Manus)
      navigate("/super-admin/login");
      return;
    }
    if (!isPlatformAdmin) {
      // Tenant ou usuário sem permissão — redireciona para dashboard do tenant
      navigate("/dashboard");
    }
  }, [loading, user, isPlatformAdmin, navigate]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#0f1117" }}
      >
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#1B4F8A" }} />
      </div>
    );
  }

  if (!user || !isPlatformAdmin) {
    // Mostra tela de acesso negado enquanto o redirect processa
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: "#0f1117" }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "rgba(239,68,68,0.1)" }}
        >
          <ShieldAlert className="w-8 h-8" style={{ color: "#ef4444" }} />
        </div>
        <h1 className="text-xl font-bold text-white">Acesso Negado</h1>
        <p className="text-sm" style={{ color: "#64748b" }}>
          Esta área é restrita ao administrador da plataforma.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="mt-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "#1B4F8A" }}
        >
          Voltar ao sistema
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
