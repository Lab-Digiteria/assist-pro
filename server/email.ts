/**
 * email.ts — Helper de e-mail transacional via Resend
 * Usado para: boas-vindas ao trial, alerta de trial expirando, confirmação de pagamento
 */
import { Resend } from "resend";
import { ENV } from "./_core/env";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) _resend = new Resend(ENV.resendApiKey);
  return _resend;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<boolean> {
  if (!ENV.resendApiKey) {
    console.warn("[Email] RESEND_API_KEY não configurada — e-mail não enviado");
    return false;
  }
  try {
    const { error } = await getResend().emails.send({
      from: ENV.resendFromEmail,
      to,
      subject,
      html,
    });
    if (error) {
      console.error("[Email] Erro ao enviar:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Email] Exceção ao enviar:", err);
    return false;
  }
}

// ─── TEMPLATES ───────────────────────────────────────────────────────────────

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Assist-Pró</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#1B4F8A;padding:28px 40px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
              ⚡ Assist-Pró
            </h1>
            <p style="margin:4px 0 0;color:#93c5fd;font-size:13px;">Gestão inteligente para assistências técnicas</p>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding:36px 40px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
              © 2025 Assist-Pró · Todos os direitos reservados<br/>
              <a href="#" style="color:#1B4F8A;text-decoration:none;">Cancelar inscrição</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** E-mail de boas-vindas enviado logo após o cadastro do trial */
export function buildWelcomeEmail(opts: {
  name: string;
  companyName: string;
  trialDays: number;
  loginUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `Bem-vindo ao Assist-Pró, ${opts.name}! Seu trial de ${opts.trialDays} dias começa agora`,
    html: baseLayout(`
      <h2 style="margin:0 0 8px;color:#0f172a;font-size:24px;font-weight:700;">
        Olá, ${opts.name}! 👋
      </h2>
      <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
        Sua conta da <strong>${opts.companyName}</strong> foi criada com sucesso. Você tem
        <strong style="color:#1B4F8A;">${opts.trialDays} dias grátis</strong> para explorar
        tudo que o Assist-Pró tem a oferecer.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td style="background:#f0f7ff;border-radius:8px;padding:20px 24px;border-left:4px solid #1B4F8A;">
            <p style="margin:0 0 12px;color:#1e3a5f;font-size:14px;font-weight:600;">O que você pode fazer agora:</p>
            <ul style="margin:0;padding-left:20px;color:#475569;font-size:14px;line-height:1.8;">
              <li>Cadastrar seus clientes e equipamentos</li>
              <li>Criar e gerenciar Ordens de Serviço</li>
              <li>Controlar seu estoque de peças</li>
              <li>Acompanhar o financeiro da sua assistência</li>
              <li>Compartilhar o status da OS com seus clientes</li>
            </ul>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td align="center">
            <a href="${opts.loginUrl}"
               style="display:inline-block;background:#1B4F8A;color:#ffffff;text-decoration:none;
                      font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;
                      letter-spacing:0.2px;">
              Acessar o Assist-Pró →
            </a>
          </td>
        </tr>
      </table>

      <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">
        Qualquer dúvida, responda este e-mail. Estamos aqui para ajudar durante todo o seu período de avaliação.
      </p>
    `),
  };
}

/** Alerta enviado 3 dias antes do trial expirar */
export function buildTrialExpiringEmail(opts: {
  name: string;
  companyName: string;
  daysLeft: number;
  upgradeUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `⏰ Seu trial do Assist-Pró expira em ${opts.daysLeft} dia${opts.daysLeft > 1 ? "s" : ""}`,
    html: baseLayout(`
      <h2 style="margin:0 0 8px;color:#0f172a;font-size:24px;font-weight:700;">
        ${opts.name}, seu trial está quase acabando
      </h2>
      <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
        Faltam apenas <strong style="color:#C4733A;">${opts.daysLeft} dia${opts.daysLeft > 1 ? "s" : ""}</strong> para
        o período de avaliação da <strong>${opts.companyName}</strong> expirar.
        Para continuar usando o Assist-Pró sem interrupções, escolha um plano agora.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td style="background:#fff7ed;border-radius:8px;padding:20px 24px;border-left:4px solid #C4733A;">
            <p style="margin:0 0 8px;color:#7c2d12;font-size:14px;font-weight:600;">O que acontece quando o trial expira?</p>
            <ul style="margin:0;padding-left:20px;color:#475569;font-size:14px;line-height:1.8;">
              <li>Seu acesso ao sistema será bloqueado</li>
              <li>Seus dados ficam preservados por 30 dias</li>
              <li>Ao assinar, você retoma de onde parou</li>
            </ul>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td align="center">
            <a href="${opts.upgradeUrl}"
               style="display:inline-block;background:#C4733A;color:#ffffff;text-decoration:none;
                      font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;
                      letter-spacing:0.2px;">
              Escolher meu plano agora →
            </a>
          </td>
        </tr>
      </table>

      <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">
        Planos a partir de <strong>R$99/mês</strong>. Cancele quando quiser, sem fidelidade.
      </p>
    `),
  };
}

/** Confirmação de pagamento após upgrade para plano pago */
export function buildPaymentConfirmationEmail(opts: {
  name: string;
  companyName: string;
  planName: string;
  amount: string;
  loginUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `✅ Pagamento confirmado — Bem-vindo ao plano ${opts.planName}!`,
    html: baseLayout(`
      <h2 style="margin:0 0 8px;color:#0f172a;font-size:24px;font-weight:700;">
        Pagamento confirmado! 🎉
      </h2>
      <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
        Olá, <strong>${opts.name}</strong>! O pagamento da <strong>${opts.companyName}</strong>
        foi processado com sucesso. Você agora tem acesso completo ao plano
        <strong style="color:#1B4F8A;">${opts.planName}</strong>.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td style="background:#f0fdf4;border-radius:8px;padding:20px 24px;border-left:4px solid #16a34a;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="color:#475569;font-size:14px;">Plano</td>
                <td align="right" style="color:#0f172a;font-size:14px;font-weight:600;">${opts.planName}</td>
              </tr>
              <tr>
                <td style="color:#475569;font-size:14px;padding-top:8px;">Valor</td>
                <td align="right" style="color:#0f172a;font-size:14px;font-weight:600;padding-top:8px;">${opts.amount}</td>
              </tr>
              <tr>
                <td style="color:#475569;font-size:14px;padding-top:8px;">Status</td>
                <td align="right" style="padding-top:8px;">
                  <span style="background:#dcfce7;color:#16a34a;font-size:12px;font-weight:600;
                               padding:2px 10px;border-radius:20px;">Pago</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td align="center">
            <a href="${opts.loginUrl}"
               style="display:inline-block;background:#1B4F8A;color:#ffffff;text-decoration:none;
                      font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;
                      letter-spacing:0.2px;">
              Acessar o Assist-Pró →
            </a>
          </td>
        </tr>
      </table>

      <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">
        O recibo detalhado está disponível no seu painel Stripe. Para cancelar ou alterar seu plano,
        acesse Configurações → Assinatura dentro do sistema.
      </p>
    `),
  };
}

/**
 * Template: OS pronta para retirada
 * Disparado automaticamente quando a OS muda para status "pronto_aguardando_retirada"
 */
export function buildOsProntaEmail(opts: {
  clienteNome: string;
  osNumero: string;
  equipamentoDescricao: string;
  tenantNome: string;
  tenantWhatsapp?: string;
  clientTokenUrl?: string;
}): { subject: string; html: string } {
  return {
    subject: `✅ Seu equipamento está pronto para retirada — OS ${opts.osNumero}`,
    html: baseLayout(`
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e293b;">
        Equipamento pronto! 🎉
      </h2>
      <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">
        Olá, <strong>${opts.clienteNome}</strong>! Temos uma ótima notícia.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:#f8fafc;border-radius:10px;padding:20px;margin-bottom:24px;">
        <tr>
          <td>
            <p style="margin:0 0 6px;font-size:13px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">
              Ordem de Serviço
            </p>
            <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#1B4F8A;">${opts.osNumero}</p>
            <p style="margin:0 0 6px;font-size:13px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">
              Equipamento
            </p>
            <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#1e293b;">${opts.equipamentoDescricao}</p>
            <p style="margin:0 0 6px;font-size:13px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">
              Assistência Técnica
            </p>
            <p style="margin:0;font-size:15px;color:#1e293b;">${opts.tenantNome}</p>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
        Seu equipamento foi reparado com sucesso e está aguardando retirada em nossa loja.
        ${opts.tenantWhatsapp ? `Entre em contato pelo WhatsApp <strong>${opts.tenantWhatsapp}</strong> para combinar horário.` : ""}
      </p>
      ${opts.clientTokenUrl ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td align="center">
            <a href="${opts.clientTokenUrl}"
               style="display:inline-block;background:#C4733A;color:#ffffff;text-decoration:none;
                      font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;
                      letter-spacing:0.2px;">
              Ver detalhes da OS →
            </a>
          </td>
        </tr>
      </table>
      ` : ""}
      <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">
        Caso já tenha retirado o equipamento, desconsidere este e-mail.
      </p>
    `),
  };
}

/**
 * Template: Orçamento aguardando aprovação do cliente
 * Disparado automaticamente quando a OS muda para status "aguardando_aprovacao"
 * Os botões Aprovar/Rejeitar são links GET simples — sem necessidade de login
 */
export function buildOrcamentoEmail(opts: {
  clienteNome: string;
  osNumero: string;
  equipamentoDescricao: string;
  tenantNome: string;
  tenantWhatsapp?: string;
  valorTotal: number;
  laudoTecnico?: string;
  aprovarUrl: string;
  rejeitarUrl: string;
  validadeOrcamento?: Date;
}): { subject: string; html: string } {
  const valorFormatado = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(opts.valorTotal);
  const validadeStr = opts.validadeOrcamento
    ? new Intl.DateTimeFormat("pt-BR").format(opts.validadeOrcamento)
    : null;

  return {
    subject: `📋 Orçamento disponível — OS ${opts.osNumero} (responda com 1 clique)`,
    html: baseLayout(`
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e293b;">
        Orçamento pronto para sua aprovação
      </h2>
      <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">
        Olá, <strong>${opts.clienteNome}</strong>! O diagnóstico do seu equipamento foi concluído
        e o orçamento está disponível. Revise e responda com um clique — nenhum login necessário.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:#f8fafc;border-radius:10px;padding:20px;margin-bottom:24px;">
        <tr><td>
          <p style="margin:0 0 6px;font-size:13px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Ordem de Serviço</p>
          <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#1B4F8A;">${opts.osNumero}</p>

          <p style="margin:0 0 6px;font-size:13px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Equipamento</p>
          <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#1e293b;">${opts.equipamentoDescricao}</p>

          ${opts.laudoTecnico ? `
          <p style="margin:0 0 6px;font-size:13px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Diagnóstico / Laudo</p>
          <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.6;white-space:pre-line;">${opts.laudoTecnico}</p>
          ` : ""}

          <p style="margin:0 0 6px;font-size:13px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Valor Total do Serviço</p>
          <p style="margin:0 ${validadeStr ? "0 16px" : "0"};font-size:32px;font-weight:800;color:#16a34a;">${valorFormatado}</p>

          ${validadeStr ? `
          <p style="margin:0 0 6px;font-size:13px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Validade do Orçamento</p>
          <p style="margin:0;font-size:14px;color:#ef4444;font-weight:600;">⏰ Válido até ${validadeStr}</p>
          ` : ""}
        </td></tr>
      </table>

      <!-- Botões de ação -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr>
          <td width="50%" style="padding-right:8px;">
            <a href="${opts.aprovarUrl}"
               style="display:block;background:#16a34a;color:#ffffff;text-decoration:none;
                      font-size:16px;font-weight:700;padding:18px 12px;border-radius:8px;
                      text-align:center;">
              ✅ Aprovar Orçamento
            </a>
          </td>
          <td width="50%" style="padding-left:8px;">
            <a href="${opts.rejeitarUrl}"
               style="display:block;background:#dc2626;color:#ffffff;text-decoration:none;
                      font-size:16px;font-weight:700;padding:18px 12px;border-radius:8px;
                      text-align:center;">
              ❌ Rejeitar Orçamento
            </a>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;line-height:1.6;">
        Ao clicar em <strong>Aprovar</strong>, você autoriza a execução do serviço pelo valor indicado.
        Ao clicar em <strong>Rejeitar</strong>, você poderá informar o motivo e o equipamento será devolvido sem reparo.
      </p>
      ${opts.tenantWhatsapp ? `
      <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;">
        Dúvidas? Fale conosco pelo WhatsApp: <strong>${opts.tenantWhatsapp}</strong>
      </p>
      ` : ""}
    `),
  };
}

/** E-mail de redefinição de senha */
export function buildPasswordResetEmail(opts: {
  name: string;
  resetUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `Redefinição de senha — Assist-Pró`,
    html: baseLayout(`
      <h2 style="margin:0 0 8px;color:#0f172a;font-size:24px;font-weight:700;">
        Redefinição de senha
      </h2>
      <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
        Olá, <strong>${opts.name}</strong>! Recebemos uma solicitação para redefinir a senha da sua conta no Assist-Pró.
      </p>
      <p style="margin:0 0 8px;color:#475569;font-size:15px;line-height:1.6;">
        Clique no botão abaixo para criar uma nova senha. Este link é válido por <strong>1 hora</strong>.
      </p>

      <a href="${opts.resetUrl}"
         style="display:inline-block;background:#1B6FD8;color:#ffffff;text-decoration:none;
                font-size:16px;font-weight:700;padding:16px 32px;border-radius:8px;
                margin:20px 0 24px;">
        Redefinir minha senha →
      </a>

      <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;line-height:1.6;">
        Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha permanece a mesma.
      </p>
      <p style="margin:0;color:#94a3b8;font-size:12px;">
        Por segurança, nunca compartilhe este link com ninguém.
      </p>
    `),
  };
}
