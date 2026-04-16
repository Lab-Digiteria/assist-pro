/**
 * Job: Alerta de Trial Expirando
 * Roda a cada 6 horas e envia e-mail para tenants cujo trial expira em 3 dias.
 * Usa um Set em memória para evitar duplicatas durante o ciclo de vida do servidor.
 * Para persistência entre reinicializações, o job verifica se trialEndsAt está
 * no intervalo de 3-4 dias — janela estreita que naturalmente evita reenvios.
 */
import { getDb } from "../db";
import { tenants } from "../../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { sendEmail, buildTrialExpiringEmail } from "../email";

// Set em memória para evitar reenvio na mesma sessão do servidor
const alreadySent = new Set<number>();

export async function runTrialAlertJob() {
  const db = await getDb();
  if (!db) return;

  const now = new Date();
  // Janela: trial expira entre 3 e 4 dias a partir de agora
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const in4Days = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

  const expiringTenants = await db
    .select()
    .from(tenants)
    .where(
      and(
        eq(tenants.subscriptionStatus, "trial"),
        gte(tenants.trialEndsAt, in3Days),
        lte(tenants.trialEndsAt, in4Days)
      )
    );

  for (const tenant of expiringTenants) {
    if (!tenant.email) continue;
    if (alreadySent.has(tenant.id)) {
      console.log(`[TrialAlertJob] Tenant ${tenant.id} já recebeu alerta nessa sessão — pulando`);
      continue;
    }

    const daysLeft = Math.ceil(
      (tenant.trialEndsAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    const { subject, html } = buildTrialExpiringEmail({
      name: tenant.name,
      companyName: tenant.name,
      daysLeft,
      upgradeUrl: "https://assistpro.com.br/planos",
    });

    const sent = await sendEmail({ to: tenant.email, subject, html });

    if (sent) {
      alreadySent.add(tenant.id);
      console.log(`[TrialAlertJob] Alerta enviado para tenant ${tenant.id} (${tenant.email})`);
    }
  }
}

export function startTrialAlertJob() {
  // Rodar imediatamente e depois a cada 6 horas
  runTrialAlertJob().catch(err => console.error("[TrialAlertJob] Erro:", err));
  setInterval(
    () => runTrialAlertJob().catch(err => console.error("[TrialAlertJob] Erro:", err)),
    6 * 60 * 60 * 1000
  );
  console.log("[TrialAlertJob] Job de alerta de trial iniciado (intervalo: 6h)");
}
