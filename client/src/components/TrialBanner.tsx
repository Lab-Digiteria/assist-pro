/**
 * TrialBanner — Banner de aviso de trial no topo do sistema.
 * Exibe dias restantes e botão de upgrade quando o tenant está em trial.
 */
import { trpc } from "@/lib/trpc";
import { Clock, X, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export function TrialBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [, navigate] = useLocation();
  const { data: sub } = trpc.subscriptions.mySubscription.useQuery(undefined, {
    staleTime: 60_000,
  });

  if (dismissed || !sub || sub.status !== "trialing") return null;

  const days = sub.trialDaysLeft ?? 0;
  const isUrgent = days <= 3;

  return (
    <div
      className={`w-full px-4 py-2 flex items-center justify-between text-sm ${
        isUrgent
          ? "bg-red-600 text-white"
          : "bg-[#1B4F8A] text-white"
      }`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Clock className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">
          {days === 0
            ? "Seu trial encerra hoje!"
            : `Período de teste — ${days} dia${days !== 1 ? "s" : ""} restante${days !== 1 ? "s" : ""}.`}
        </span>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
        <button
          className="flex items-center gap-1 font-semibold underline hover:no-underline text-sm whitespace-nowrap"
          onClick={() => navigate("/planos")}
        >
          Ver planos <ArrowRight className="w-3 h-3" />
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Fechar banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
