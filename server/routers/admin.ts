/**
 * admin.ts — Control Plane router
 * Todos os endpoints são protegidos por adminProcedure (role=admin)
 */
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { auditLogs, emailCampaigns, leads, plans, subscriptions, tenants } from "../../drizzle/schema";
import { nanoid } from "nanoid";
import { logAudit } from "../audit";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

// Middleware admin-only
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito ao administrador." });
  }
  return next({ ctx });
});

export const adminRouter = router({
  // ─── PLANOS (CRUD) ──────────────────────────────────────────────────────────
  plans: router({
    list: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db.select().from(plans).orderBy(plans.createdAt);
    }),

    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        priceMonthly: z.number().int().min(0),
        trialDays: z.number().int().min(0).default(14),
        stripePriceId: z.string().optional(),
        isLifetime: z.boolean().default(false),
        isActive: z.boolean().default(true),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const newId = nanoid();
        await db.insert(plans).values({
          id: newId,
          name: input.name,
          slug: input.slug,
          priceMonthly: input.priceMonthly,
          trialDays: input.trialDays,
          stripePriceId: input.stripePriceId ?? null,
          isLifetime: input.isLifetime,
          isActive: input.isActive,
        });
        await logAudit({
          actorId: ctx.user.id,
          actorName: ctx.user.name ?? "admin",
          action: "admin.plans.create",
          resource: "plan",
          resourceId: newId,
          metadata: { name: input.name, slug: input.slug },
        });
        return { success: true };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.string().min(1),
        name: z.string().min(1).optional(),
        priceMonthly: z.number().int().min(0).optional(),
        trialDays: z.number().int().min(0).optional(),
        stripePriceId: z.string().optional(),
        isLifetime: z.boolean().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { id, ...fields } = input;
        const updateData: Record<string, unknown> = {};
        if (fields.name !== undefined) updateData.name = fields.name;
        if (fields.priceMonthly !== undefined) updateData.priceMonthly = fields.priceMonthly;
        if (fields.trialDays !== undefined) updateData.trialDays = fields.trialDays;
        if (fields.stripePriceId !== undefined) updateData.stripePriceId = fields.stripePriceId;
        if (fields.isLifetime !== undefined) updateData.isLifetime = fields.isLifetime;
        if (fields.isActive !== undefined) updateData.isActive = fields.isActive;
        await db.update(plans).set(updateData).where(eq(plans.id, id));
        await logAudit({
          actorId: ctx.user.id,
          actorName: ctx.user.name ?? "admin",
          action: "admin.plans.update",
          resource: "plan",
          resourceId: id,
          metadata: updateData,
        });
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        // Verificar se há subscriptions ativas usando este plano
        const active = await db
          .select({ id: subscriptions.id })
          .from(subscriptions)
          .where(eq(subscriptions.planId, input.id))
          .limit(1);
        if (active.length > 0) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Não é possível excluir um plano com assinaturas ativas.",
          });
        }
        await db.delete(plans).where(eq(plans.id, input.id));
        await logAudit({
          actorId: ctx.user.id,
          actorName: ctx.user.name ?? "admin",
          action: "admin.plans.delete",
          resource: "plan",
          resourceId: input.id,
        });
        return { success: true };
      }),
  }),

  // ─── AUDIT LOGS ─────────────────────────────────────────────────────────────
  auditLogs: router({
    list: adminProcedure
      .input(z.object({
        limit: z.number().int().min(1).max(200).default(50),
        offset: z.number().int().min(0).default(0),
        tenantId: z.number().int().optional(),
        action: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const rows = await db
          .select()
          .from(auditLogs)
          .orderBy(desc(auditLogs.createdAt))
          .limit(input.limit)
          .offset(input.offset);
        return rows;
      }),
  }),

  // ─── LEADS (admin view) ─────────────────────────────────────────────────────
  leads: router({
    list: adminProcedure
      .input(z.object({
        limit: z.number().int().min(1).max(200).default(50),
        offset: z.number().int().min(0).default(0),
        status: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const rows = await db
          .select()
          .from(leads)
          .orderBy(desc(leads.createdAt))
          .limit(input.limit)
          .offset(input.offset);
        return rows;
      }),

    updateStatus: adminProcedure
      .input(z.object({
        id: z.number().int(),
        status: z.enum(["new", "contacted", "trial", "converted", "churned", "lost"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.update(leads).set({
          status: input.status,
          notes: input.notes ?? undefined,
        }).where(eq(leads.id, input.id));
        await logAudit({
          actorId: ctx.user.id,
          actorName: ctx.user.name ?? "admin",
          action: "admin.leads.updateStatus",
          resource: "lead",
          resourceId: String(input.id),
          metadata: { status: input.status },
        });
        return { success: true };
      }),
  }),

  // ─── CAMPANHAS EMAIL ────────────────────────────────────────────────────────
  campaigns: router({
    list: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db.select().from(emailCampaigns).orderBy(desc(emailCampaigns.createdAt));
    }),

    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        subject: z.string().min(1),
        body: z.string().min(1),
        targetSegment: z.enum(["all", "trial", "churned", "converted"]).default("all"),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.insert(emailCampaigns).values({
          name: input.name,
          subject: input.subject,
          body: input.body,
          targetSegment: input.targetSegment,
          status: "draft",
        });
        await logAudit({
          actorId: ctx.user.id,
          actorName: ctx.user.name ?? "admin",
          action: "admin.campaigns.create",
          resource: "emailCampaign",
          metadata: { name: input.name, targetSegment: input.targetSegment },
        });
        return { success: true };
      }),
  }),

  // ─── TENANTS (admin view) ───────────────────────────────────────────────────
  tenantStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const all = await db.select().from(tenants);
    const now = new Date();
    return {
      total: all.length,
      active: all.filter(t => t.subscriptionStatus === "active").length,
      trialing: all.filter(t => t.subscriptionStatus === "trial").length,
      expired: all.filter(t => t.subscriptionStatus === "expired" || t.subscriptionStatus === "canceled").length,
      trialExpiringSoon: all.filter(t => {
        if (t.subscriptionStatus !== "trial" || !t.trialEndsAt) return false;
        const daysLeft = Math.ceil((t.trialEndsAt.getTime() - now.getTime()) / 86400000);
        return daysLeft <= 3 && daysLeft >= 0;
      }).length,
    };
  }),
});
