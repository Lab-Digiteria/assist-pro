/**
 * TrialBanner — Banner de aviso de trial no topo do sistema.
 * Exibe dias restantes e botão de upgrade quando o tenant está em trial.
 */
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Clock, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function TrialBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { data: sub } = trpc.subscriptions.mySubscription.useQuery(undefined, {
    staleTime: 60_000,
  });
  const checkout = trpc.billing.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.info("Redirecionando para o checkout...");
        window.open(data.url, "_blank");
      }
    },
    onError: (e) => toast.error(e.message),
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
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 flex-shrink-0" />
        <span>
          {days === 0
            ? "Seu trial encerra hoje!"
            : `Você está no período de teste — ${days} dia${days !== 1 ? "s" : ""} restante${days !== 1 ? "s" : ""}.`}
          {" "}
          <button
            className="underline font-semibold hover:no-underline"
            onClick={() => checkout.mutate({ planSlug: "mensal", origin: window.location.origin })}
          >
            Assinar agora
          </button>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant="outline"
          className="h-6 text-xs bg-white text-[#1B4F8A] border-white hover:bg-gray-100 hover:text-[#1B4F8A]"
          disabled={checkout.isPending}
          onClick={() => checkout.mutate({ planSlug: "mensal", origin: window.location.origin })}
        >
          Assinar
        </Button>
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
