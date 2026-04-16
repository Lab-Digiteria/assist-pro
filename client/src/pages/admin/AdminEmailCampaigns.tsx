/**
 * Control Plane — Campanhas Email
 * Rota: /admin/campaigns
 */
import { useState } from "react";
import { CoreLayout } from "@/components/CoreLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Mail, Send, Users, RefreshCw } from "lucide-react";

const TEMPLATES = [
  {
    id: "trial_expiring",
    name: "Trial Expirando",
    subject: "Seu trial do Assist-Pró está acabando — não perca o acesso!",
    body: `Olá {{nome}},

Seu período de trial do Assist-Pró expira em breve. Para continuar gerenciando sua assistência técnica sem interrupções, assine agora e aproveite todos os recursos:

✅ Ordens de Serviço ilimitadas
✅ Controle de estoque
✅ Relatórios financeiros
✅ Comissões automáticas para técnicos

👉 Acesse o sistema e escolha o plano ideal para você.

Qualquer dúvida, estamos aqui!

Equipe Assist-Pró`,
  },
  {
    id: "reengagement",
    name: "Reengajamento de Ex-Trials",
    subject: "Sentimos sua falta — 30 dias grátis no plano Premium!",
    body: `Olá {{nome}},

Percebemos que você testou o Assist-Pró mas ainda não assinou. Queremos te dar uma segunda chance com uma oferta especial:

🎁 30 dias grátis no Plano Anual (R$ 799/ano)
🎁 Após aprovação: 90 dias de assinatura gratuita

O que há de novo desde seu trial:
• Checklist de entrada aprimorado
• Dashboard com alertas críticos
• Exportação de relatórios em PDF e CSV

Esta oferta é válida por 7 dias.

Equipe Assist-Pró`,
  },
  {
    id: "welcome",
    name: "Boas-vindas ao Trial",
    subject: "Bem-vindo ao Assist-Pró! Seu trial de 14 dias começa agora",
    body: `Olá {{nome}},

Sua conta no Assist-Pró foi criada com sucesso! Você tem 14 dias para explorar todas as funcionalidades sem custo.

🚀 Por onde começar:
1. Cadastre seus primeiros clientes
2. Crie uma Ordem de Serviço
3. Configure o estoque de peças
4. Explore o Dashboard

Qualquer dúvida, responda este e-mail.

Equipe Assist-Pró`,
  },
];

export default function AdminEmailCampaigns() {
  const [selectedTemplate, setSelectedTemplate] = useState("none");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all_trials");

  const leadsQuery = trpc.tenants.adminListLeads.useQuery();
  const subsQuery = trpc.tenants.adminListSubscriptions.useQuery();

  function applyTemplate(id: string) {
    const tpl = TEMPLATES.find((t) => t.id === id);
    if (tpl) {
      setSubject(tpl.subject);
      setBody(tpl.body);
    }
  }

  function getAudienceCount() {
    if (audience === "all_trials") return (subsQuery.data ?? []).filter((s: any) => s.status === "trialing").length;
    if (audience === "expiring") return (subsQuery.data ?? []).filter((s: any) => {
      if (s.status !== "trialing" || !s.trialEndsAt) return false;
      const days = Math.ceil((new Date(s.trialEndsAt).getTime() - Date.now()) / 86400000);
      return days <= 3;
    }).length;
    if (audience === "all_leads") return (leadsQuery.data ?? []).length;
    if (audience === "lost_leads") return (leadsQuery.data ?? []).filter((l: any) => l.status === "lost").length;
    return 0;
  }

  function handleSend() {
    if (!subject || !body) {
      toast.error("Preencha o assunto e o corpo do e-mail");
      return;
    }
    toast.success(`Campanha agendada para ${getAudienceCount()} destinatário(s). (Integração com provedor de e-mail necessária para envio real)`);
  }

  return (
    <CoreLayout title="Campanhas Email">
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Composer */}
          <div className="lg:col-span-2 space-y-4">
            <Card style={{ background: "#161b27", borderColor: "#1e2535" }}>
              <CardHeader>
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <Mail className="w-4 h-4" style={{ color: "#1B4F8A" }} />
                  Compor Campanha
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: "#94a3b8" }}>Template</label>
                  <Select value={selectedTemplate} onValueChange={(v) => { setSelectedTemplate(v); if (v !== "none") applyTemplate(v); }}>
                    <SelectTrigger style={{ background: "#0f1117", borderColor: "#1e2535", color: "#e2e8f0" }}>
                      <SelectValue placeholder="Selecionar template…" />
                    </SelectTrigger>
                    <SelectContent style={{ background: "#161b27", borderColor: "#1e2535" }}>
                      <SelectItem value="none">Sem template</SelectItem>
                      {TEMPLATES.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: "#94a3b8" }}>Audiência</label>
                  <Select value={audience} onValueChange={setAudience}>
                    <SelectTrigger style={{ background: "#0f1117", borderColor: "#1e2535", color: "#e2e8f0" }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={{ background: "#161b27", borderColor: "#1e2535" }}>
                      <SelectItem value="all_trials">Todos em Trial</SelectItem>
                      <SelectItem value="expiring">Trials Expirando (≤3 dias)</SelectItem>
                      <SelectItem value="all_leads">Todos os Leads</SelectItem>
                      <SelectItem value="lost_leads">Leads Perdidos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: "#94a3b8" }}>Assunto</label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Assunto do e-mail…"
                    style={{ background: "#0f1117", borderColor: "#1e2535", color: "#e2e8f0" }}
                  />
                </div>

                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: "#94a3b8" }}>Corpo</label>
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={12}
                    placeholder="Conteúdo do e-mail…"
                    style={{ background: "#0f1117", borderColor: "#1e2535", color: "#e2e8f0", resize: "vertical" }}
                  />
                  <p className="text-xs mt-1" style={{ color: "#64748b" }}>
                    Use <code className="text-white font-mono">{"{{nome}}"}</code> para personalizar com o nome do destinatário.
                  </p>
                </div>

                <Button
                  onClick={handleSend}
                  className="w-full"
                  style={{ background: "#1B4F8A", color: "#fff" }}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar para {getAudienceCount()} destinatário{getAudienceCount() !== 1 ? "s" : ""}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Templates sidebar */}
          <div className="space-y-4">
            <Card style={{ background: "#161b27", borderColor: "#1e2535" }}>
              <CardHeader>
                <CardTitle className="text-sm text-white">Templates Disponíveis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setSelectedTemplate(t.id); applyTemplate(t.id); }}
                    className="w-full text-left p-3 rounded-lg border transition-colors hover:border-blue-500/50"
                    style={{ background: "#0f1117", borderColor: "#1e2535" }}
                  >
                    <p className="text-xs font-medium text-white">{t.name}</p>
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "#64748b" }}>{t.subject}</p>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card style={{ background: "#161b27", borderColor: "#1e2535" }}>
              <CardHeader>
                <CardTitle className="text-sm text-white flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" style={{ color: "#1B4F8A" }} />
                  Audiência Selecionada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">{getAudienceCount()}</p>
                <p className="text-xs mt-1" style={{ color: "#64748b" }}>destinatário{getAudienceCount() !== 1 ? "s" : ""}</p>
                <p className="text-xs mt-3 p-2 rounded" style={{ background: "#0f1117", color: "#64748b" }}>
                  Para envio real, integre com SendGrid, Resend ou outro provedor de e-mail transacional.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </CoreLayout>
  );
}
