/**
 * Stripe Reconciliation Job
 * Compares internal subscription state with Stripe and corrects divergences.
 * Run daily or on-demand via the admin panel.
 */
import Stripe from "stripe";
import { getDb } from "./db";
import { tenants } from "../drizzle/schema";
import { eq, isNotNull } from "drizzle-orm";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

type SubscriptionStatus = "trial" | "active" | "past_due" | "suspended" | "canceled" | "expired";

function mapStripeStatus(stripeStatus: string): SubscriptionStatus {
  switch (stripeStatus) {
    case "active": return "active";
    case "trialing": return "trial";
    case "past_due": return "past_due";
    case "canceled": return "canceled";
    case "unpaid": return "suspended";
    case "paused": return "suspended";
    default: return "expired";
  }
}

export async function runStripeReconciliation(): Promise<{ checked: number; corrected: number; errors: string[] }> {
  const stripe = getStripe();
  if (!stripe) {
    return { checked: 0, corrected: 0, errors: ["Stripe not configured"] };
  }

  const db = await getDb();
  if (!db) {
    return { checked: 0, corrected: 0, errors: ["DB unavailable"] };
  }

  // Get all tenants with a Stripe subscription ID
  const activeTenants = await db
    .select()
    .from(tenants)
    .where(isNotNull(tenants.stripeSubscriptionId));

  let checked = 0;
  let corrected = 0;
  const errors: string[] = [];

  for (const tenant of activeTenants) {
    if (!tenant.stripeSubscriptionId) continue;
    checked++;

    try {
      const subscription = await stripe.subscriptions.retrieve(tenant.stripeSubscriptionId);
      const expectedStatus = mapStripeStatus(subscription.status);

      if (tenant.subscriptionStatus !== expectedStatus) {
        await db
          .update(tenants)
          .set({ subscriptionStatus: expectedStatus })
          .where(eq(tenants.id, tenant.id));

        console.log(
          `[Reconcile] Tenant ${tenant.id} (${tenant.name}): ${tenant.subscriptionStatus} → ${expectedStatus}`
        );
        corrected++;
      }
    } catch (err: any) {
      const msg = `Tenant ${tenant.id}: ${err.message}`;
      errors.push(msg);
      console.error(`[Reconcile] Error for ${msg}`);
    }
  }

  console.log(`[Reconcile] Done: ${checked} checked, ${corrected} corrected, ${errors.length} errors`);
  return { checked, corrected, errors };
}
