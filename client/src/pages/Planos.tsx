/**
 * Planos.tsx — Tela de upgrade/assinatura do Assist-Pró.
 * Exibe os planos disponíveis e inicia o Stripe Checkout.
 */
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Star, Crown } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

const PLAN_CONFIG: Record<string, {
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  features: string[];
  highlight: boolean;
}> = {
  mensal: {
    icon: <Zap className="w-6 h-6 text-[#C4733A]" />,
    features: [
      "Ordens de Serviço ilimitadas",
      "Módulo de Estoque",
      "Caixa e Financeiro",
      "Relatórios com exportação CSV",
      "Suporte por WhatsApp",
    ],
    highlight: false,
  },
  anual: {
    icon: <Star className="w-6 h-6 text-[#E8C547]" />,
    badge: "Mais popular",
    badgeColor: "bg-[#E8C547] text-gray-900",
    features: [
      "Tudo do Plano Mensal",
      "2 meses grátis",
      "Dashboard avançado",
      "Comissões de técnicos",
      "Prioridade no suporte",
    ],
    highlight: true,
  },
  vitalicio: {
    icon: <Crown className="w-6 h-6 text-[#1B4F8A]" />,
    badge: "Melhor custo-benefício",
    badgeColor: "bg-[#1B4F8A] text-white",
    features: [
      "Tudo do Plano Anual",
      "Pagamento único",
      "Acesso vitalício",
      "Atualizações incluídas",
      "Suporte prioritário vitalício",
    ],
    highlight: false,
  },
};

function formatPrice(priceMonthly: number, slug: string): { main: string; sub: string } {
  const brl = (cents: number) =>
    (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  if (slug === "mensal") return { main: brl(priceMonthly), sub: "/mês" };
  if (slug === "anual") return { main: brl(priceMonthly), sub: "/ano" };
  return { main: brl(priceMonthly), sub: "pagamento único" };
}

export default function Planos() {
  const { isAuthenticated } = useAuth();
  const { data: plansList = [], isLoading } = trpc.subscriptions.listPlans.useQuery();
  const checkout = trpc.billing.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.info("Redirecionando para o checkout...");
        window.open(data.url, "_blank");
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubscribe = (slug: string) => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    checkout.mutate({ planSlug: slug as "mensal" | "anual" | "vitalicio", origin: window.location.origin });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1B4F8A] text-white py-16 px-4 text-center">
        <h1 className="text-3xl font-bold mb-3">Escolha seu plano</h1>
        <p className="text-blue-200 max-w-xl mx-auto">
          Todos os planos incluem 14 dias de trial gratuito. Cancele a qualquer momento.
        </p>
      </div>

      {/* Plans */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-12">Carregando planos...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plansList.map((plan) => {
              const config = PLAN_CONFIG[plan.slug] ?? PLAN_CONFIG.mensal;
              const price = formatPrice(plan.priceMonthly, plan.slug);
              return (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col ${
                    config.highlight
                      ? "border-2 border-[#C4733A] shadow-lg scale-105"
                      : "border border-gray-200"
                  }`}
                >
                  {config.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className={`text-xs font-semibold px-3 py-1 ${config.badgeColor}`}>
                        {config.badge}
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2 pt-6">
                    <div className="flex justify-center mb-3">{config.icon}</div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-[#1B4F8A]">{price.main}</span>
                      <span className="text-sm text-muted-foreground ml-1">{price.sub}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {plan.trialDays} dias grátis
                    </p>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-2 flex-1 mb-6">
                      {config.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full ${
                        config.highlight
                          ? "bg-[#C4733A] hover:bg-[#a85e2f] text-white"
                          : "bg-[#1B4F8A] hover:bg-[#163f6e] text-white"
                      }`}
                      disabled={checkout.isPending}
                      onClick={() => handleSubscribe(plan.slug)}
                    >
                      {checkout.isPending ? "Aguarde..." : `Começar com ${plan.name}`}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Trial note */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Ao clicar em "Começar", você será redirecionado para o checkout seguro do Stripe.
          Use o cartão <strong>4242 4242 4242 4242</strong> para testar em modo sandbox.
        </p>

        <div className="text-center mt-4">
          <a href="/" className="text-sm text-[#1B4F8A] hover:underline">← Voltar para o início</a>
        </div>
      </div>
    </div>
  );
}
