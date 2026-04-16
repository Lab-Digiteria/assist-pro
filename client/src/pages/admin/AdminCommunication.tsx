/**
 * Control Plane — Comunicação
 * Rota: /admin/communication
 */
import { CoreLayout } from "@/components/CoreLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Mail, Phone, Bell } from "lucide-react";

const CHANNELS = [
  {
    icon: Mail,
    name: "E-mail Transacional",
    status: "Pendente configuração",
    statusColor: "#eab308",
    description: "Integre com SendGrid, Resend ou Amazon SES para envio de e-mails de boas-vindas, trial expirando e recuperação de senha.",
    action: "Configurar provedor",
  },
  {
    icon: Phone,
    name: "WhatsApp Business",
    status: "Pendente configuração",
    statusColor: "#eab308",
    description: "Integre com Twilio, Z-API ou Evolution API para notificações automáticas por WhatsApp (trial expirando, OS concluída, etc.).",
    action: "Configurar API",
  },
  {
    icon: Bell,
    name: "Notificações Push",
    status: "Não configurado",
    statusColor: "#6b7280",
    description: "Notificações push para os usuários do sistema via Web Push API ou Firebase Cloud Messaging.",
    action: "Configurar",
  },
  {
    icon: MessageSquare,
    name: "Chat de Suporte",
    status: "Não configurado",
    statusColor: "#6b7280",
    description: "Integre com Intercom, Crisp ou Chatwoot para suporte em tempo real aos tenants.",
    action: "Configurar",
  },
];

export default function AdminCommunication() {
  return (
    <CoreLayout title="Comunicação">
      <div className="space-y-6">
        <Card style={{ background: "#161b27", borderColor: "#1e2535" }}>
          <CardContent className="pt-4">
            <p className="text-sm" style={{ color: "#94a3b8" }}>
              Configure os canais de comunicação com os tenants da plataforma. Cada canal pode ser ativado
              individualmente conforme a necessidade do negócio.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CHANNELS.map((ch) => {
            const Icon = ch.icon;
            return (
              <Card key={ch.name} style={{ background: "#161b27", borderColor: "#1e2535" }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(27,79,138,0.15)" }}>
                        <Icon className="w-4 h-4" style={{ color: "#1B4F8A" }} />
                      </div>
                      <CardTitle className="text-sm text-white">{ch.name}</CardTitle>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded"
                      style={{ background: ch.statusColor + "15", color: ch.statusColor }}>
                      {ch.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs mb-3" style={{ color: "#64748b" }}>{ch.description}</p>
                  <button className="text-xs font-medium" style={{ color: "#1B4F8A" }}>
                    {ch.action} →
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </CoreLayout>
  );
}
