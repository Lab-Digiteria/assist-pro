/**
 * routers/billing.ts
 * Stripe Checkout e Portal do Cliente para o Assist-Pró.
 * Suporta tanto auth próprio (ctx.tenantId) quanto Manus OAuth (resolveTenantId).
 */
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, getTenantByOwner, getTenantByMember } from "../db";
import { plans, subscriptions, tenants } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe não configurado" });
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

async function resolveTenantId(ctx: { user: { id: number }; tenantId?: number | null }): Promise<number> {
  // Auth próprio: tenantId já está no contexto
  if (ctx.tenantId) return ctx.tenantId;
  // Manus OAuth: resolver pelo userId
  const owned = await getTenantByOwner(ctx.user.id);
  if (owned) return owned.id;
  const member = await getTenantByMember(ctx.user.id);
  if (member) return member.id;
  throw new TRPCError({ code: "FORBIDDEN", message: "Você não pertence a nenhuma empresa" });
}

async function getTenantById(tenantId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  return result[0] ?? null;
}

// Configuração dos planos (preços em centavos BRL)
const PLAN_CONFIG = {
  mensal:    { name: "Assist-Pró Mensal",    description: "Plano Mensal — R$ 99/mês",     amount: 9900,   interval: "month" as const, isLifetime: false },
  anual:     { name: "Assist-Pró Anual",     description: "Plano Anual — R$ 799/ano",      amount: 79900,  interval: "year"  as const, isLifetime: false },
  vitalicio: { name: "Assist-Pró Vitalício", description: "Acesso vitalício — R$ 1.499",   amount: 149900, interval: null,             isLifetime: true  },
};

export const billingRouter = router({
  /**
   * createCheckout — Cria sessão de checkout Stripe para o plano escolhido.
   */
  createCheckout: protectedProcedure
    .input(z.object({
      planSlug: z.enum(["mensal", "anual", "vitalicio"]),
      origin: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe();
      const tenantId = await resolveTenantId(ctx);
      const tenant = await getTenantById(tenantId);
      if (!tenant) throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada" });

      const plan = PLAN_CONFIG[input.planSlug];
      const successUrl = `${input.origin}/configuracoes?checkout=success&plan=${input.planSlug}`;
      const cancelUrl  = `${input.origin}/configuracoes?checkout=cancel`;

      // Garantir customer Stripe
      let customerId = tenant.stripeCustomerId ?? undefined;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: tenant.email ?? ctx.user.email ?? undefined,
          name: tenant.name,
          metadata: { tenantId: String(tenantId), userId: String(ctx.user.id) },
        });
        customerId = customer.id;
        const db = await getDb();
        if (db) {
          await db.update(tenants).set({ stripeCustomerId: customerId }).where(eq(tenants.id, tenantId));
          await db.update(subscriptions).set({ stripeCustomerId: customerId }).where(eq(subscriptions.tenantId, tenantId));
        }
      }

      const commonMetadata = {
        tenantId: String(tenantId),
        userId: String(ctx.user.id),
        planSlug: input.planSlug,
        customer_email: tenant.email ?? ctx.user.email ?? "",
        customer_name: tenant.name,
      };

      if (plan.isLifetime) {
        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          mode: "payment",
          allow_promotion_codes: true,
          line_items: [{
            price_data: {
              currency: "brl",
              product_data: { name: plan.name, description: plan.description },
              unit_amount: plan.amount,
            },
            quantity: 1,
          }],
          client_reference_id: String(tenantId),
          metadata: commonMetadata,
          success_url: successUrl,
          cancel_url: cancelUrl,
        });
        return { url: session.url };
      } else {
        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          mode: "subscription",
          allow_promotion_codes: true,
          line_items: [{
            price_data: {
              currency: "brl",
              product_data: { name: plan.name, description: plan.description },
              unit_amount: plan.amount,
              recurring: { interval: plan.interval! },
            },
            quantity: 1,
          }],
          subscription_data: {
            metadata: { tenantId: String(tenantId), planSlug: input.planSlug },
          },
          client_reference_id: String(tenantId),
          metadata: commonMetadata,
          success_url: successUrl,
          cancel_url: cancelUrl,
        });
        return { url: session.url };
      }
    }),

  /**
   * createPortal — Portal do cliente Stripe.
   */
  createPortal: protectedProcedure
    .input(z.object({ origin: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe();
      const tenantId = await resolveTenantId(ctx);
      const tenant = await getTenantById(tenantId);
      if (!tenant?.stripeCustomerId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma assinatura ativa encontrada" });
      }
      const session = await stripe.billingPortal.sessions.create({
        customer: tenant.stripeCustomerId,
        return_url: `${input.origin}/configuracoes`,
      });
      return { url: session.url };
    }),

  /**
   * status — Retorna status de billing do tenant atual.
   */
  status: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const tenantId = await resolveTenantId(ctx).catch(() => null);
    if (!tenantId) return null;

    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.tenantId, tenantId)).limit(1);
    const [plan] = sub ? await db.select().from(plans).where(eq(plans.id, sub.planId)).limit(1) : [];

    const now = Date.now();
    let trialDaysLeft: number | null = null;
    if (sub?.status === "trialing" && sub.trialEndsAt) {
      const diff = sub.trialEndsAt.getTime() - now;
      trialDaysLeft = Math.max(0, Math.ceil(diff / 86400000));
    }

    return {
      status: sub?.status ?? "trialing",
      trialDaysLeft,
      trialEndsAt: sub?.trialEndsAt?.toISOString() ?? null,
      planName: plan?.name ?? "—",
      planSlug: plan?.slug ?? "—",
    };
  }),
});
