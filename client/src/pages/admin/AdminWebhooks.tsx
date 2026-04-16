/**
 * Control Plane — Webhooks
 * Rota: /admin/webhooks
 */
import { CoreLayout } from "@/components/CoreLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Webhook, Shield, CheckCircle2, AlertCircle } from "lucide-react";

const WEBHOOK_EVENTS = [
  { event: "checkout.session.completed", action: "Ativa subscription do tenant", status: "active" },
  { event: "customer.subscription.updated", action: "Atualiza status da subscription", status: "active" },
  { event: "customer.subscription.deleted", action: "Cancela subscription do tenant", status: "active" },
  { event: "invoice.payment_failed", action: "Marca subscription como past_due", status: "active" },
];

export default function AdminWebhooks() {
  return (
    <CoreLayout title="Webhooks">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card style={{ background: "#161b27", borderColor: "#1e2535" }}>
            <CardContent className="pt-4">
              <p className="text-xs mb-1" style={{ color: "#64748b" }}>Assinatura</p>
              <p className="text-sm font-bold text-white">HMAC-SHA256</p>
              <p className="text-xs mt-1" style={{ color: "#64748b" }}>Verificação de assinatura ativa</p>
            </CardContent>
          </Card>
          <Card style={{ background: "#161b27", borderColor: "#1e2535" }}>
            <CardContent className="pt-4">
              <p className="text-xs mb-1" style={{ color: "#64748b" }}>Idempotência</p>
              <p className="text-sm font-bold" style={{ color: "#22c55e" }}>Ativa</p>
              <p className="text-xs mt-1" style={{ color: "#64748b" }}>Tabela stripeEvents no banco</p>
            </CardContent>
          </Card>
          <Card style={{ background: "#161b27", borderColor: "#1e2535" }}>
            <CardContent className="pt-4">
              <p className="text-xs mb-1" style={{ color: "#64748b" }}>Endpoint</p>
              <code className="text-xs font-mono text-white">/api/stripe/webhook</code>
              <p className="text-xs mt-1" style={{ color: "#64748b" }}>express.raw antes do json()</p>
            </CardContent>
          </Card>
        </div>

        <Card style={{ background: "#161b27", borderColor: "#1e2535" }}>
          <CardHeader>
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Webhook className="w-4 h-4" style={{ color: "#1B4F8A" }} />
              Eventos Configurados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {WEBHOOK_EVENTS.map((ev) => (
                <div key={ev.event} className="flex items-center justify-between py-2.5 border-b last:border-0"
                  style={{ borderColor: "#1e2535" }}>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#22c55e" }} />
                    <div>
                      <code className="text-xs font-mono text-white">{ev.event}</code>
                      <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{ev.action}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded"
                    style={{ background: "#22c55e15", color: "#22c55e" }}>
                    Ativo
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card style={{ background: "#161b27", borderColor: "#1e2535" }}>
          <CardHeader>
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <Shield className="w-4 h-4" style={{ color: "#C4733A" }} />
              Segurança
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs" style={{ color: "#64748b" }}>
              Todos os webhooks são verificados via <code className="text-white font-mono">stripe.webhooks.constructEvent()</code> com
              a chave <code className="text-white font-mono">STRIPE_WEBHOOK_SECRET</code>. Eventos de teste (prefixo <code className="text-white font-mono">evt_test_</code>)
              retornam <code className="text-white font-mono">{`{ verified: true }`}</code> sem processar. Eventos duplicados são
              descartados via tabela <code className="text-white font-mono">stripeEvents</code>.
            </p>
          </CardContent>
        </Card>
      </div>
    </CoreLayout>
  );
}
