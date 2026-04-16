/**
 * ImpersonationBanner — exibido quando um admin está acessando o sistema
 * como um tenant (impersonation). Mostra aviso proeminente e botão de saída.
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";

export function ImpersonationBanner() {
  const { user } = useAuth();
  const exitMutation = trpc.admin.exitImpersonation.useMutation({
    onSuccess: () => {
      toast.success("Impersonation encerrada. Redirecionando...");
      // Pequeno delay para o cookie ser limpo antes do redirect
      setTimeout(() => {
        window.location.href = "/admin/tenants";
      }, 500);
    },
    onError: (e) => {
      toast.error(e.message);
      // Mesmo com erro, limpar e redirecionar
      setTimeout(() => {
        window.location.href = "/admin/tenants";
      }, 1000);
    },
  });

  // Só exibe se isImpersonating estiver ativo
  const meData = user as (typeof user & { isImpersonating?: boolean }) | null;
  if (!meData?.isImpersonating) return null;

  return (
    <div
      className="flex items-center justify-between px-4 py-2.5 text-sm font-medium"
      style={{
        background: "#7c2d12",
        borderBottom: "2px solid #c2410c",
        color: "#fff",
        zIndex: 50,
      }}
    >
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 flex-shrink-0" style={{ color: "#fb923c" }} />
        <span>
          Você está acessando como{" "}
          <strong>{meData.name}</strong> — modo de suporte (impersonation ativa)
        </span>
      </div>
      <button
        onClick={() => exitMutation.mutate()}
        disabled={exitMutation.isPending}
        className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors"
        style={{
          background: "#c2410c",
          color: "#fff",
          border: "1px solid #ea580c",
          cursor: exitMutation.isPending ? "wait" : "pointer",
        }}
      >
        <X className="w-3 h-3" />
        {exitMutation.isPending ? "Saindo..." : "Sair da impersonation"}
      </button>
    </div>
  );
}
