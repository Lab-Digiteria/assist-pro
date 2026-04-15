import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  addTenantMember,
  createTenant,
  getAllTenants,
  getDb,
  getTenantByMember,
  getTenantByOwner,
  getTenantMembers,
  removeTenantMember,
  updateMemberRole,
  updateTenantStatus,
} from "../db";
import { subscriptions } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { validateCNPJ, validateCPF } from "../../shared/utils";
import { runStripeReconciliation } from "../stripe-reconcile";

export const tenantsRouter = router({
  // Get current user's tenant (owner or member)
  mine: protectedProcedure.query(async ({ ctx }) => {
    const owned = await getTenantByOwner(ctx.user.id);
    if (owned) return { ...owned, myRole: "manager" as const };
    const member = await getTenantByMember(ctx.user.id);
    if (member) return member;
    return null;
  }),

  // Create tenant (onboarding)
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(255),
        cpfCnpj: z.string().min(11).max(18),
        whatsapp: z.string().min(10).max(20),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate CPF/CNPJ
      const cleaned = input.cpfCnpj.replace(/\D/g, "");
      const valid = cleaned.length === 11 ? validateCPF(cleaned) : validateCNPJ(cleaned);
      if (!valid) throw new TRPCError({ code: "BAD_REQUEST", message: "CPF/CNPJ inválido" });

      // Check if already has tenant
      const existing = await getTenantByOwner(ctx.user.id);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Você já possui uma empresa cadastrada" });

      return createTenant({
        name: input.name,
        ownerUserId: ctx.user.id,
        cpfCnpj: input.cpfCnpj,
        whatsapp: input.whatsapp,
        email: input.email,
      });
    }),

  // Admin: list all tenants
  adminList: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    return getAllTenants();
  }),

  // Admin: update tenant status
  adminUpdateStatus: protectedProcedure
    .input(
      z.object({
        tenantId: z.number(),
        status: z.enum(["trial", "active", "past_due", "suspended", "canceled", "expired"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      await updateTenantStatus(input.tenantId, input.status);
      return { success: true };
    }),

  // Members
  members: protectedProcedure.query(async ({ ctx }) => {
    const tenant = await getTenantByOwner(ctx.user.id);
    if (!tenant) throw new TRPCError({ code: "NOT_FOUND" });
    return getTenantMembers(tenant.id);
  }),

  addMember: protectedProcedure
    .input(z.object({ userId: z.number(), role: z.enum(["manager", "technician", "viewer"]) }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getTenantByOwner(ctx.user.id);
      if (!tenant) throw new TRPCError({ code: "NOT_FOUND" });
      await addTenantMember(tenant.id, input.userId, input.role);
      return { success: true };
    }),

  updateMemberRole: protectedProcedure
    .input(z.object({ memberId: z.number(), role: z.enum(["manager", "technician", "viewer"]) }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getTenantByOwner(ctx.user.id);
      if (!tenant) throw new TRPCError({ code: "NOT_FOUND" });
      await updateMemberRole(input.memberId, input.role);
      return { success: true };
    }),

  removeMember: protectedProcedure
    .input(z.object({ memberId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await getTenantByOwner(ctx.user.id);
      if (!tenant) throw new TRPCError({ code: "NOT_FOUND" });
      await removeTenantMember(input.memberId);
      return { success: true };
    }),

  // Admin: extend trial
  adminExtendTrial: protectedProcedure
    .input(z.object({ tenantId: z.number(), days: z.number().min(1).max(90) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.tenantId, input.tenantId)).limit(1);
      if (sub) {
        const currentEnd = sub.trialEndsAt ? new Date(sub.trialEndsAt) : new Date();
        const newEnd = new Date(currentEnd.getTime() + input.days * 86400000);
        await db.update(subscriptions)
          .set({ trialEndsAt: newEnd, status: "trialing", updatedAt: new Date() })
          .where(eq(subscriptions.tenantId, input.tenantId));
      }
      await updateTenantStatus(input.tenantId, "trial");
      return { success: true };
    }),

  // Admin: suspend tenant
  adminSuspend: protectedProcedure
    .input(z.object({ tenantId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(subscriptions)
        .set({ status: "suspended", updatedAt: new Date() })
        .where(eq(subscriptions.tenantId, input.tenantId));
      await updateTenantStatus(input.tenantId, "suspended");
      return { success: true };
    }),

  // Admin: reactivate tenant
  adminReactivate: protectedProcedure
    .input(z.object({ tenantId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(subscriptions)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(subscriptions.tenantId, input.tenantId));
      await updateTenantStatus(input.tenantId, "active");
      return { success: true };
    }),

  // Admin: run Stripe reconciliation
  stripeReconcile: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    return runStripeReconciliation();
  }),
});
