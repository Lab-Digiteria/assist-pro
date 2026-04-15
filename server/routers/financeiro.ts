import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  addCaixaLancamentoManual,
  getCaixaLancamentos,
  getDashboardData,
  getTenantByMember,
  getTenantByOwner,
  getComissoesTecnico,
  upsertComissaoTecnico,
  getAllLeads,
  createLead,
  updateLeadStatus,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

async function resolveTenantId(userId: number): Promise<number> {
  const owned = await getTenantByOwner(userId);
  if (owned) return owned.id;
  const member = await getTenantByMember(userId);
  if (member) return member.id;
  throw new TRPCError({ code: "FORBIDDEN" });
}

export const financeiroRouter = router({
  // Caixa
  caixaList: protectedProcedure
    .input(
      z.object({
        from: z.string().optional(),
        to: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);
      return getCaixaLancamentos(tenantId, {
        from: input.from ? new Date(input.from) : undefined,
        to: input.to ? new Date(input.to) : undefined,
      });
    }),

  caixaAddManual: protectedProcedure
    .input(
      z.object({
        tipo: z.enum(["entrada", "saida"]),
        descricao: z.string().min(1),
        valor: z.number().min(0.01),
        formaPagamento: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);
      await addCaixaLancamentoManual(tenantId, { ...input, userId: ctx.user.id });
      return { success: true };
    }),

  // Dashboard
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = await resolveTenantId(ctx.user.id);
    return getDashboardData(tenantId);
  }),

  // Comissões
  comissoes: protectedProcedure
    .input(z.object({ tecnicoId: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);
      return getComissoesTecnico(tenantId, input.tecnicoId);
    }),

  upsertComissao: protectedProcedure
    .input(
      z.object({
        tecnicoId: z.number(),
        categoria: z.enum([
          "smartphone",
          "tablet",
          "notebook",
          "desktop",
          "smartwatch",
          "console",
          "tv",
          "outro",
        ]),
        percentual: z.number().min(0).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);
      await upsertComissaoTecnico(tenantId, input.tecnicoId, input.categoria, input.percentual);
      return { success: true };
    }),
});

// Leads router (admin only)
export const leadsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    return getAllLeads();
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2),
        email: z.string().email().optional(),
        whatsapp: z.string().optional(),
        cpfCnpj: z.string().optional(),
        source: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await createLead(input);
      return { success: true };
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["new", "contacted", "trial", "converted", "churned", "lost"]),
        tenantId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      await updateLeadStatus(input.id, input.status, input.tenantId);
      return { success: true };
    }),
});
