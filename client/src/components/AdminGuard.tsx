/**
 * AdminGuard — protege rotas /admin/* no frontend
 * Redireciona para / se o usuário não for admin
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, ShieldAlert } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f1117" }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#1B4F8A" }} />
      </div>
    );
  }

  if (!user) return null;

  // Verifica role admin
  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#0f1117" }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "rgba(239,68,68,0.1)" }}>
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
