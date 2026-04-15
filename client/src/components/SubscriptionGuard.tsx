/**
 * SubscriptionGuard — Bloqueia o acesso ao sistema quando o tenant não tem assinatura ativa.
 * Baseado no SaaS_Core do OficinaPro.
 *
 * Status bloqueados: trial_expired, suspended, canceled, expired
 * Status permitidos: trialing, active
 */
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CreditCard, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

const BLOCKED_STATUSES = ["trial_expired", "suspended", "canceled", "expired", "past_due"];

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { data: sub, isLoading } = trpc.subscriptions.mySubscription.useQuery(undefined, {
    refetchInterval: 60_000, // Verificar a cada minuto
    staleTime: 30_000,
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

  // Enquanto carrega, renderiza normalmente (evita flash de bloqueio)
  if (isLoading || !sub) return <>{children}</>;

  const isBlocked = BLOCKED_STATUSES.includes(sub.status);

  if (!isBlocked) return <>{children}</>;

  // Tela de bloqueio
  const statusConfig = {
    trial_expired: {
      icon: <Clock className="w-12 h-12 text-amber-500" />,
      title: "Seu período de teste encerrou",
      description: "Seu trial de 14 dias chegou ao fim. Escolha um plano para continuar usando o Assist-Pró.",
      color: "border-amber-200 bg-amber-50",
    },
    past_due: {
      icon: <AlertTriangle className="w-12 h-12 text-orange-500" />,
      title: "Pagamento pendente",
      description: "Há um pagamento em aberto na sua assinatura. Regularize para continuar usando o sistema.",
      color: "border-orange-200 bg-orange-50",
    },
    suspended: {
      icon: <AlertTriangle className="w-12 h-12 text-red-500" />,
      title: "Conta suspensa",
      description: "Sua conta foi suspensa por falta de pagamento. Regularize sua assinatura para reativar o acesso.",
      color: "border-red-200 bg-red-50",
    },
    canceled: {
      icon: <XCircle className="w-12 h-12 text-gray-500" />,
      title: "Assinatura cancelada",
      description: "Sua assinatura foi cancelada. Assine novamente para continuar usando o Assist-Pró.",
      color: "border-gray-200 bg-gray-50",
    },
    expired: {
      icon: <XCircle className="w-12 h-12 text-gray-500" />,
      title: "Assinatura expirada",
      description: "Sua assinatura expirou. Renove para continuar usando o Assist-Pró.",
      color: "border-gray-200 bg-gray-50",
    },
  };

  const config = statusConfig[sub.status as keyof typeof statusConfig] ?? statusConfig.expired;

  const plans = [
    { slug: "mensal" as const,    label: "Plano Mensal",    price: "R$ 99/mês" },
    { slug: "anual" as const,     label: "Plano Anual",     price: "R$ 799/ano" },
    { slug: "vitalicio" as const, label: "Plano Vitalício", price: "R$ 1.499 único" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-6">
        <Card className={`border-2 ${config.color}`}>
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">{config.icon}</div>
            <CardTitle className="text-xl">{config.title}</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">{config.description}</p>
            <div className="grid grid-cols-1 gap-3">
              {plans.map((plan) => (
                <Button
                  key={plan.slug}
                  variant="outline"
                  className="w-full justify-between border-2 hover:border-[#1B4F8A] hover:bg-[#1B4F8A] hover:text-white transition-all"
                  disabled={checkout.isPending}
                  onClick={() => checkout.mutate({ planSlug: plan.slug, origin: window.location.origin })}
                >
                  <span className="font-semibold">{plan.label}</span>
                  <span className="text-sm font-bold">{plan.price}</span>
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Dúvidas? Entre em contato pelo WhatsApp ou e-mail de suporte.
            </p>
          </CardContent>
        </Card>

        <div className="text-center">
          <a href="/" className="text-sm text-[#1B4F8A] hover:underline">
            ← Voltar para a página inicial
          </a>
        </div>
      </div>
    </div>
  );
}
