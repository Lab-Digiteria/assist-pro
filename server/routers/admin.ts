/**
 * admin.ts — Control Plane router
 * Todos os endpoints são protegidos por adminProcedure (role=admin)
 */
import { TRPCError } from "@trpc/server";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { auditLogs, emailCampaigns, leads, plans, subscriptions, tenants, users } from "../../drizzle/schema";
import { nanoid } from "nanoid";
import { logAudit } from "../audit";
import { getDb, getTenantMembers, getUserById } from "../db";
import { signImpersonateJwt } from "../jwt";
import { getSessionCookieOptions } from "../_core/cookies";
import { IMPERSONATE_COOKIE_NAME } from "../../shared/const";
import { protectedProcedure, router } from "../_core/trpc";

// Middleware admin-only
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito ao administrador." });
  }
  return next({ ctx });
});

export const adminRouter = router({
  // ─── IMPERSONATION ──────────────────────────────────────────────────────────
  /**
   * Gera um JWT de impersonation (1h) e seta o cookie de sessão.
   * O admin passa a navegar como o tenant-alvo sem saber a senha.
   */
  impersonate: adminProcedure
    .input(z.object({ tenantId: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Buscar o tenant alvo
      const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, input.tenantId))
        .limit(1);
      if (!tenant) throw new TRPCError({ code: "NOT_FOUND", message: "Tenant não encontrado." });

      // Buscar o primeiro membro (owner) do tenant
      const members = await getTenantMembers(input.tenantId);
      if (!members || members.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Nenhum usuário encontrado para este tenant." });
      }
      const firstMember = members[0];
      const targetUser = firstMember.userId ? await getUserById(firstMember.userId) : null;
      if (!targetUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário do tenant não encontrado." });
      }

      // Gerar JWT de impersonation (expira em 1h)
      const token = await signImpersonateJwt({
        adminId: ctx.user.id,
        targetUserId: targetUser.id,
        targetEmail: targetUser.email ?? "",
        targetName: targetUser.name ?? tenant.name,
        targetTenantId: tenant.id,
        targetTenantSlug: tenant.slug,
      });

      // Registrar no audit log
      await logAudit({
        actorId: ctx.user.id,
        actorName: ctx.user.name ?? "admin",
        action: "admin.impersonate",
        resource: "tenant",
        resourceId: String(input.tenantId),
        metadata: { tenantName: tenant.name, targetUserId: targetUser.id },
      });

      // Setar cookie de impersonation separado (ap_impersonate) — 1h de validade
      // O cookie de sessão do admin (COOKIE_NAME) é preservado
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(IMPERSONATE_COOKIE_NAME, token, { ...cookieOptions, maxAge: 60 * 60 * 1000 });

      return { success: true, tenantSlug: tenant.slug };
    }),

  /**
   * Limpa o cookie de impersonation (ap_impersonate).
   * O cookie de sessão do admin (COOKIE_NAME) é preservado — admin continua logado.
   */
  exitImpersonation: protectedProcedure
    .mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(IMPERSONATE_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),

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

  // ─── TENANTS (admin view) ──────────────────────────────────────────────────────────────────────────
  /**
   * Lista todos os tenants com informações de acesso gratuito.
   */
  listTenants: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const now = new Date();
    const rows = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        email: tenants.email,
        whatsapp: tenants.whatsapp,
        subscriptionStatus: tenants.subscriptionStatus,
        trialEndsAt: tenants.trialEndsAt,
        subscriptionEndsAt: tenants.subscriptionEndsAt,
        freeAccessEnabled: tenants.freeAccessEnabled,
        freeAccessGrantedAt: tenants.freeAccessGrantedAt,
        freeAccessExpiresAt: tenants.freeAccessExpiresAt,
        freeAccessNote: tenants.freeAccessNote,
        freeAccessGrantedBy: tenants.freeAccessGrantedBy,
        createdAt: tenants.createdAt,
        ownerUserId: tenants.ownerUserId,
      })
      .from(tenants)
      .orderBy(desc(tenants.createdAt));

    // Enrich with owner name
    const enriched = await Promise.all(
      rows.map(async (t) => {
        const owner = await getUserById(t.ownerUserId);
        // Determine effective access status
        let accessStatus: "free" | "free_expired" | "active" | "trial" | "trial_expired" | "suspended" | "canceled" = "canceled";
        if (t.freeAccessEnabled) {
          if (!t.freeAccessExpiresAt || t.freeAccessExpiresAt > now) {
            accessStatus = "free";
          } else {
            accessStatus = "free_expired";
          }
        } else if (t.subscriptionStatus === "active") {
          accessStatus = "active";
        } else if (t.subscriptionStatus === "trial") {
          accessStatus = t.trialEndsAt && t.trialEndsAt > now ? "trial" : "trial_expired";
        } else if (t.subscriptionStatus === "suspended" || t.subscriptionStatus === "past_due") {
          accessStatus = "suspended";
        } else {
          accessStatus = "canceled";
        }
        return { ...t, ownerName: owner?.name ?? null, ownerEmail: owner?.email ?? null, accessStatus };
      })
    );
    return enriched;
  }),

  /**
   * Concede acesso gratuito a um tenant.
   * expiresAt = null significa acesso indefinido.
   */
  grantFreeAccess: adminProcedure
    .input(
      z.object({
        tenantId: z.number().int(),
        expiresAt: z.string().datetime().nullable().optional(), // ISO string or null
        note: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [tenant] = await db.select().from(tenants).where(eq(tenants.id, input.tenantId)).limit(1);
      if (!tenant) throw new TRPCError({ code: "NOT_FOUND", message: "Tenant não encontrado." });

      await db
        .update(tenants)
        .set({
          freeAccessEnabled: true,
          freeAccessGrantedAt: new Date(),
          freeAccessExpiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          freeAccessGrantedBy: ctx.user.id,
          freeAccessNote: input.note ?? null,
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, input.tenantId));

      await logAudit({
        actorId: ctx.user.id,
        actorName: ctx.user.name ?? "admin",
        action: "admin.grantFreeAccess",
        resource: "tenant",
        resourceId: String(input.tenantId),
        metadata: {
          tenantName: tenant.name,
          expiresAt: input.expiresAt ?? "indefinite",
          note: input.note,
        },
      });

      return { success: true };
    }),

  /**
   * Revoga o acesso gratuito de um tenant.
   */
  revokeFreeAccess: adminProcedure
    .input(z.object({ tenantId: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [tenant] = await db.select().from(tenants).where(eq(tenants.id, input.tenantId)).limit(1);
      if (!tenant) throw new TRPCError({ code: "NOT_FOUND", message: "Tenant não encontrado." });

      await db
        .update(tenants)
        .set({
          freeAccessEnabled: false,
          freeAccessExpiresAt: null,
          freeAccessNote: null,
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, input.tenantId));

      await logAudit({
        actorId: ctx.user.id,
        actorName: ctx.user.name ?? "admin",
        action: "admin.revokeFreeAccess",
        resource: "tenant",
        resourceId: String(input.tenantId),
        metadata: { tenantName: tenant.name },
      });

      return { success: true };
    }),

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
