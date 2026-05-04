/**
 * routers/subscriptions.ts
 * Gestão de assinaturas do Assist-Pró.
 */
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { billingEvents, leads, plans, subscriptions, tenants } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getTenantFromCtx } from "../tenant-ctx";

export const subscriptionsRouter = router({
  /**
   * mySubscription — Retorna status e dias restantes do trial para o tenant atual.
   * Tenants com freeAccessEnabled=true sempre recebem status "active" — sem banners de trial.
   */
  mySubscription: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    const tenantId = getTenantFromCtx(ctx);
    if (!tenantId) return null;

    const now = Date.now();

    // Verificar acesso gratuito antes de qualquer outra lógica
    const [tenant] = await db
      .select({ freeAccessEnabled: tenants.freeAccessEnabled, freeAccessExpiresAt: tenants.freeAccessExpiresAt })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (tenant?.freeAccessEnabled) {
      const freeExpired = tenant.freeAccessExpiresAt && tenant.freeAccessExpiresAt.getTime() < now;
      if (!freeExpired) {
        // Acesso gratuito ativo: retornar "active" para suprimir todos os banners e guards
        return {
          id: 0,
          status: "active" as const,
          trialDaysLeft: null,
          trialEndsAt: null,
          currentPeriodEndsAt: tenant.freeAccessExpiresAt?.toISOString() ?? null,
          planName: "Acesso Gratuito",
          planSlug: "free",
        };
      }
    }

    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, tenantId))
      .limit(1);

    if (!sub) return null;

    let trialDaysLeft: number | null = null;
    if (sub.status === "trialing" && sub.trialEndsAt) {
      const diff = sub.trialEndsAt.getTime() - now;
      trialDaysLeft = Math.max(0, Math.ceil(diff / 86400000));
    }

    const [plan] = await db.select().from(plans).where(eq(plans.id, sub.planId)).limit(1);

    return {
      id: sub.id,
      status: sub.status,
      trialDaysLeft,
      trialEndsAt: sub.trialEndsAt?.toISOString() ?? null,
      currentPeriodEndsAt: sub.currentPeriodEndsAt?.toISOString() ?? null,
      planName: plan?.name ?? "—",
      planSlug: plan?.slug ?? "—",
    };
  }),

  /**
   * listPlans — Lista planos públicos disponíveis (endpoint público).
   */
  listPlans: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(plans).where(eq(plans.isActive, true));
  }),

  /**
   * checkEntitlement — Verifica se o tenant tem acesso ao sistema.
   * Retorna FORBIDDEN se o status for bloqueado.
   */
  checkEntitlement: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { allowed: true };
    const tenantId = getTenantFromCtx(ctx);
    if (!tenantId) return { allowed: true };

    // Acesso gratuito ativo: sempre permitido
    const [tenant] = await db
      .select({ freeAccessEnabled: tenants.freeAccessEnabled, freeAccessExpiresAt: tenants.freeAccessExpiresAt })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (tenant?.freeAccessEnabled) {
      const freeExpired = tenant.freeAccessExpiresAt && tenant.freeAccessExpiresAt.getTime() < Date.now();
      if (!freeExpired) return { allowed: true, status: "active" };
    }

    const [sub] = await db
      .select({ status: subscriptions.status })
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, tenantId))
      .limit(1);
    const BLOCKED = ["trial_expired", "suspended", "canceled", "expired"];
    if (sub && BLOCKED.includes(sub.status)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Acesso bloqueado: assinatura com status '${sub.status}'. Regularize para continuar.`,
      });
    }
    return { allowed: true, status: sub?.status ?? null };
  }),

  /**
   * seedPlans — Cria os planos padrão do Assist-Pró se não existirem.
   * Chamado automaticamente no startup do servidor.
   */
  seedPlans: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Apenas admins podem fazer seed de planos" });
    }
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    await seedDefaultPlans(db);
    return { success: true };
  }),
});

export async function seedDefaultPlans(db: NonNullable<Awaited<ReturnType<typeof getDb>>>) {
  const existing = await db.select({ id: plans.id }).from(plans).limit(1);
  if (existing.length > 0) return; // Já existem planos

  const defaultPlans = [
    {
      id: crypto.randomUUID(),
      name: "Mensal",
      slug: "mensal",
      priceMonthly: 9900, // R$ 99,00 em centavos
      trialDays: 14,
      isLifetime: false,
      isActive: true,
    },
    {
      id: crypto.randomUUID(),
      name: "Anual",
      slug: "anual",
      priceMonthly: 79900, // R$ 799,00 em centavos
      trialDays: 14,
      isLifetime: false,
      isActive: true,
    },
    {
      id: crypto.randomUUID(),
      name: "Vitalício",
      slug: "vitalicio",
      priceMonthly: 149900, // R$ 1.499,00 em centavos
      trialDays: 14,
      isLifetime: true,
      isActive: true,
    },
  ];

  for (const plan of defaultPlans) {
    await db.insert(plans).values(plan).onDuplicateKeyUpdate({ set: { name: plan.name } });
  }
}

/**
 * transitionSubscription — Muda o status de uma assinatura com event sourcing.
 */
export async function transitionSubscription(
  tenantId: number,
  newStatus: "trialing" | "active" | "past_due" | "suspended" | "canceled" | "expired"
) {
  const db = await getDb();
  if (!db) return;

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.tenantId, tenantId))
    .limit(1);

  if (!sub) return;

  const now = new Date();
  const updates: Partial<typeof sub> = { status: newStatus };

  if (newStatus === "active") {
    updates.currentPeriodStartsAt = now;
    updates.currentPeriodEndsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    updates.canceledAt = null;
  }
  if (newStatus === "canceled") {
    updates.canceledAt = now;
  }

  await db.update(subscriptions).set(updates).where(eq(subscriptions.id, sub.id));

  // Sincronizar status no tenant também
  const tenantStatus = newStatus === "trialing" ? "trial" : newStatus;
  await db
    .update(tenants)
    .set({ subscriptionStatus: tenantStatus as "trial" | "active" | "past_due" | "suspended" | "canceled" | "expired" })
    .where(eq(tenants.id, tenantId));

  // Event sourcing
  await db.insert(billingEvents).values({
    eventId: crypto.randomUUID(),
    eventType: `subscription.${newStatus}`,
    tenantId,
    payload: { subscriptionId: sub.id, from: sub.status, to: newStatus },
    idempotencyKey: `${sub.id}:${sub.status}:${newStatus}:${now.getTime()}`,
  });

  // Atualizar lead para "converted" se ativar
  if (newStatus === "active") {
    await db
      .update(leads)
      .set({ status: "converted" })
      .where(eq(leads.tenantId, tenantId));
  }
}
