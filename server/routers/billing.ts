import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
import { z } from "zod";
import { getDb, getTenantByOwner, getTenantByMember } from "../db";
import { tenants } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { STRIPE_PLANS, type PlanKey } from "../stripe-products";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe não configurado" });
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

async function resolveTenantId(userId: number): Promise<number> {
  const owned = await getTenantByOwner(userId);
  if (owned) return owned.id;
  const member = await getTenantByMember(userId);
  if (member) return member.id;
  throw new TRPCError({ code: "FORBIDDEN", message: "Você não pertence a nenhuma empresa" });
}

async function getTenantById(tenantId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  return result[0] ?? null;
}

export const billingRouter = router({
  /**
   * Create a Stripe Checkout Session for a plan
   */
  createCheckout: protectedProcedure
    .input(z.object({ plan: z.enum(["monthly", "annual", "lifetime"]), origin: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe();
      const tenantId = await resolveTenantId(ctx.user.id);
      const tenant = await getTenantById(tenantId);
      if (!tenant) throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada" });

      const plan = STRIPE_PLANS[input.plan as PlanKey];
      const successUrl = `${input.origin}/dashboard?billing=success`;
      const cancelUrl = `${input.origin}/configuracoes?billing=cancel`;

      // Ensure or create Stripe customer
      let customerId = tenant.stripeCustomerId ?? undefined;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: ctx.user.email ?? undefined,
          name: ctx.user.name ?? undefined,
          metadata: { tenantId: String(tenantId), userId: String(ctx.user.id) },
        });
        customerId = customer.id;
        const db = await getDb();
        if (db) {
          await db.update(tenants).set({ stripeCustomerId: customerId }).where(eq(tenants.id, tenantId));
        }
      }

      if (plan.interval === null) {
        // One-time payment (lifetime)
        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          mode: "payment",
          allow_promotion_codes: true,
          line_items: [
            {
              price_data: {
                currency: plan.currency,
                product_data: { name: plan.name, description: plan.description },
                unit_amount: plan.amount,
              },
              quantity: 1,
            },
          ],
          client_reference_id: String(ctx.user.id),
          metadata: {
            user_id: String(ctx.user.id),
            tenant_id: String(tenantId),
            plan: input.plan,
            customer_email: ctx.user.email ?? "",
            customer_name: ctx.user.name ?? "",
          },
          success_url: successUrl,
          cancel_url: cancelUrl,
        });
        return { url: session.url };
      } else {
        // Recurring subscription
        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          mode: "subscription",
          allow_promotion_codes: true,
          line_items: [
            {
              price_data: {
                currency: plan.currency,
                product_data: { name: plan.name, description: plan.description },
                unit_amount: plan.amount,
                recurring: { interval: plan.interval },
              },
              quantity: 1,
            },
          ],
          subscription_data: {
            trial_period_days: plan.trialDays,
            metadata: { tenantId: String(tenantId), plan: input.plan },
          },
          client_reference_id: String(ctx.user.id),
          metadata: {
            user_id: String(ctx.user.id),
            tenant_id: String(tenantId),
            plan: input.plan,
            customer_email: ctx.user.email ?? "",
            customer_name: ctx.user.name ?? "",
          },
          success_url: successUrl,
          cancel_url: cancelUrl,
        });
        return { url: session.url };
      }
    }),

  /**
   * Create a Stripe Customer Portal session
   */
  createPortal: protectedProcedure
    .input(z.object({ origin: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe();
      const tenantId = await resolveTenantId(ctx.user.id);
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
   * Get current subscription status
   */
  status: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = await resolveTenantId(ctx.user.id);
    const tenant = await getTenantById(tenantId);
    if (!tenant) return null;
    return {
      subscriptionStatus: tenant.subscriptionStatus,
      subscriptionPlan: tenant.planType,
      stripeSubscriptionId: tenant.stripeSubscriptionId,
      trialEndsAt: tenant.trialEndsAt,
    };
  }),
});
