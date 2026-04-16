/**
 * Control Plane — Roteiro do Sistema
 * Rota: /admin/playbook
 */
import { CoreLayout } from "@/components/CoreLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CheckCircle2, Clock, AlertCircle } from "lucide-react";

const SECTIONS = [
  {
    title: "Fluxo SaaS",
    status: "done",
    items: [
      "Landing page com formulário de cadastro de trial",
      "lead.register: cria user + tenant + subscription(trialing) + lead em transação atômica",
      "JWT próprio (não depende de Manus OAuth para acesso ao app)",
      "Trial de 14 dias com SubscriptionGuard e TrialBanner",
      "Stripe Checkout com price_data inline (mensal/anual/vitalício)",
      "Webhook Stripe com idempotência real (tabela stripeEvents)",
      "Ativação automática de subscription ao receber checkout.session.completed",
    ],
  },
  {
    title: "Control Plane (/admin)",
    status: "done",
    items: [
      "Dashboard com métricas: tenants ativos, trials, leads, webhooks",
      "Assinantes: listagem, extendTrial, suspend, reactivate, delete (trial only)",
      "Planos: visualização dos 3 planos (mensal/anual/vitalício)",
      "Assinaturas: listagem completa com status e Stripe ID",
      "Billing: histórico + reconciliação Stripe",
      "Audit Logs: eventos Stripe processados",
      "Webhooks: configuração e segurança",
      "Leads: funil completo com status",
      "Comunicação: canais disponíveis (e-mail, WhatsApp, push)",
      "Monitoramento Trials: alertas de expiração",
      "Campanhas Email: templates de reengajamento",
    ],
  },
  {
    title: "Módulos Operacionais (Tenant)",
    status: "done",
    items: [
      "Clientes com CPF/CNPJ e validação",
      "Equipamentos com IMEI (smartphone/tablet), categoria, cor, marca, modelo",
      "Ordens de Serviço: numeração OS-YYYY-NNNN por tenant, 7 status",
      "Checklist de entrada: Estado Físico + Sintomas",
      "Estoque com movimentações e saída automática ao concluir OS",
      "Caixa com lançamentos, formas de pagamento e saldo",
      "Comissões automáticas ao transitar para 'concluido'",
      "Dashboard com alertas críticos, OS por status, financeiro e performance",
      "Relatórios com exportação CSV/PDF",
    ],
  },
  {
    title: "Pendente / Próximas iterações",
    status: "pending",
    items: [
      "Integração com provedor de e-mail (SendGrid/Resend) para campanhas reais",
      "Notificações WhatsApp automáticas (Twilio/Z-API)",
      "Impressão de OS em PDF com checklist de entrada",
      "Convite de técnicos ao tenant por e-mail",
      "Módulo de Revenda (white-label para revendedores)",
      "Reset de senha por e-mail",
    ],
  },
];

const STATUS_ICON: Record<string, React.ElementType> = {
  done: CheckCircle2,
  pending: Clock,
  warning: AlertCircle,
};

const STATUS_COLOR: Record<string, string> = {
  done: "#22c55e",
  pending: "#eab308",
  warning: "#f97316",
};

export default function AdminPlaybook() {
  return (
    <CoreLayout title="Roteiro do Sistema">
      <div className="space-y-4">
        {SECTIONS.map((section) => {
          const Icon = STATUS_ICON[section.status];
          const color = STATUS_COLOR[section.status];
          return (
            <Card key={section.title} style={{ background: "#161b27", borderColor: "#1e2535" }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-white">
                  <Icon className="w-4 h-4" style={{ color }} />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs" style={{ color: "#94a3b8" }}>
                      <span className="mt-0.5 flex-shrink-0" style={{ color }}>
                        {section.status === "done" ? "✓" : "○"}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </CoreLayout>
  );
}
