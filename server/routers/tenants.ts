import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  addTenantMember,
  createTenant,
  getAllTenants,
  getTenantByMember,
  getTenantByOwner,
  getTenantMembers,
  removeTenantMember,
  updateMemberRole,
  updateTenantStatus,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { validateCNPJ, validateCPF } from "../../shared/utils";

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
});
