import type { Express, Request, Response } from "express";
import express from "express";
import Stripe from "stripe";
import { getDb } from "./db";
import { tenants, stripeEvents } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendEmail, buildPaymentConfirmationEmail } from "./email";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

async function updateTenantSubscription(
  tenantId: number,
  status: "trial" | "active" | "past_due" | "suspended" | "canceled" | "expired",
  stripeSubscriptionId?: string,
  planType?: "monthly" | "annual" | "lifetime" | null
) {
  const db = await getDb();
  if (!db) return;
  const updates: Record<string, unknown> = { subscriptionStatus: status };
  if (stripeSubscriptionId !== undefined) updates.stripeSubscriptionId = stripeSubscriptionId;
  if (planType !== undefined) updates.planType = planType;
  await db.update(tenants).set(updates as any).where(eq(tenants.id, tenantId));
  console.log(`[Stripe Webhook] Tenant ${tenantId} → status: ${status}, plan: ${planType}`);
}

export function registerStripeWebhook(app: Express) {
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      const stripe = getStripe();
      if (!stripe) {
        console.error("[Stripe Webhook] Stripe not configured");
        return res.status(500).json({ error: "Stripe not configured" });
      }

      const sig = req.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event: Stripe.Event;
      try {
        if (!webhookSecret || !sig) {
          return res.status(400).json({ error: "Missing webhook secret or signature" });
        }
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.error("[Stripe Webhook] invalid_signature:", err.message);
        return res.status(400).json({ error: "invalid_signature" });
      }

      // Test event detection
      if (event.id.startsWith("evt_test_")) {
        console.log("[Stripe Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      // Idempotency check: skip already-processed events
      const db = await getDb();
      if (db) {
        const existing = await db
          .select()
          .from(stripeEvents)
          .where(eq(stripeEvents.eventId, event.id))
          .limit(1);
        if (existing.length > 0) {
          console.log(`[Stripe Webhook] Duplicate event ${event.id} — skipping`);
          return res.json({ received: true, duplicate: true });
        }
        // Mark event as processed
        await db.insert(stripeEvents).values({ eventId: event.id, eventType: event.type });
      }

      console.log(`[Stripe Webhook] Event: ${event.type} | ID: ${event.id}`);

      try {
        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const tenantId = parseInt(session.metadata?.tenant_id ?? "0");
            const plan = session.metadata?.plan as "monthly" | "annual" | "lifetime" | undefined;
            if (!tenantId) break;

            if (session.mode === "payment") {
              // Lifetime plan — one-time payment
              await updateTenantSubscription(tenantId, "active", undefined, "lifetime");
            } else if (session.mode === "subscription" && session.subscription) {
              await updateTenantSubscription(
                tenantId,
                "active",
                String(session.subscription),
                plan ?? null
              );
            }
            // Send payment confirmation email
            try {
              const dbForEmail = await getDb();
              if (dbForEmail) {
                const [tenant] = await dbForEmail.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
                if (tenant?.email) {
                  const planLabel = plan === "lifetime" ? "Vitalício" : plan === "annual" ? "Anual" : "Mensal";
                  const amount = session.amount_total ? session.amount_total / 100 : 0;
                  const { subject, html } = buildPaymentConfirmationEmail({
                    name: tenant.name,
                    companyName: tenant.name,
                    planName: planLabel,
                    amount: `R$ ${amount.toFixed(2)}`,
                    loginUrl: "https://assistpro.com.br/login",
                  });
                  await sendEmail({ to: tenant.email, subject, html });
                }
              }
            } catch (emailErr) {
              console.error("[Stripe Webhook] Erro ao enviar e-mail de confirmação:", emailErr);
            }
            break;
          }

          case "invoice.paid": {
            const invoice = event.data.object as any;
            const sub = invoice.subscription ? String(invoice.subscription) : undefined;
            if (!sub) break;
            // Find tenant by subscription ID
            const db = await getDb();
            if (!db) break;
            const result = await db.select().from(tenants).where(eq(tenants.stripeSubscriptionId, sub)).limit(1);
            if (result[0]) {
              await updateTenantSubscription(result[0].id, "active", sub);
            }
            break;
          }

          case "invoice.payment_failed": {
            const invoice2 = event.data.object as any;
            const sub2 = invoice2.subscription ? String(invoice2.subscription) : undefined;
            if (!sub2) break;
            const db2 = await getDb();
            if (!db2) break;
            const result2 = await db2.select().from(tenants).where(eq(tenants.stripeSubscriptionId, sub2)).limit(1);
            if (result2[0]) {
              await updateTenantSubscription(result2[0].id, "past_due", sub2);
            }
            break;
          }

          case "customer.subscription.deleted": {
            const subscription = event.data.object as Stripe.Subscription;
            const db = await getDb();
            if (!db) break;
            const result = await db.select().from(tenants).where(eq(tenants.stripeSubscriptionId, subscription.id)).limit(1);
            if (result[0]) {
              await updateTenantSubscription(result[0].id, "canceled", subscription.id);
            }
            break;
          }

          default:
            console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        }
      } catch (err) {
        console.error("[Stripe Webhook] Processing error:", err);
        return res.status(500).json({ error: "Webhook processing failed" });
      }

      return res.json({ received: true });
    }
  );
}
