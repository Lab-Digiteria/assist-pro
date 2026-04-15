import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createPeca,
  getPecas,
  getTenantByMember,
  getTenantByOwner,
  movimentarEstoque,
  updatePeca,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

async function resolveTenantAndRole(userId: number) {
  const owned = await getTenantByOwner(userId);
  if (owned) return { tenantId: owned.id, role: "manager" as const };
  const member = await getTenantByMember(userId);
  if (member) return { tenantId: member.id, role: (member as any).memberRole as string };
  throw new TRPCError({ code: "FORBIDDEN" });
}

export const estoqueRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { tenantId } = await resolveTenantAndRole(ctx.user.id);
    return getPecas(tenantId);
  }),

  create: protectedProcedure
    .input(
      z.object({
        nome: z.string().min(1).max(255),
        categoria: z.enum(["tela", "bateria", "conector", "cabo", "placa", "chip", "acessorio", "outro"]),
        precoCusto: z.number().optional(),
        precoVenda: z.number().min(0),
        quantidadeAtual: z.number().min(0).default(0),
        quantidadeMinima: z.number().min(0).default(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = await resolveTenantAndRole(ctx.user.id);
      return createPeca(tenantId, {
        nome: input.nome,
        categoria: input.categoria,
        precoCusto: input.precoCusto ? String(input.precoCusto) : undefined,
        precoVenda: String(input.precoVenda),
        quantidadeAtual: input.quantidadeAtual,
        quantidadeMinima: input.quantidadeMinima,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        nome: z.string().optional(),
        categoria: z.enum(["tela", "bateria", "conector", "cabo", "placa", "chip", "acessorio", "outro"]).optional(),
        precoCusto: z.number().optional(),
        precoVenda: z.number().optional(),
        quantidadeMinima: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, role } = await resolveTenantAndRole(ctx.user.id);
      const { id, precoCusto, precoVenda, ...rest } = input;
      const data: Record<string, unknown> = { ...rest };
      if (precoVenda !== undefined) data.precoVenda = String(precoVenda);
      // Only admin/manager can see/update precoCusto
      if (precoCusto !== undefined && (role === "manager" || ctx.user.role === "admin")) {
        data.precoCusto = String(precoCusto);
      }
      await updatePeca(tenantId, id, data as any);
      return { success: true };
    }),

  movimentar: protectedProcedure
    .input(
      z.object({
        pecaId: z.number(),
        tipo: z.enum(["entrada", "saida", "ajuste", "devolucao"]),
        quantidade: z.number().min(1),
        osId: z.number().optional(),
        observacao: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = await resolveTenantAndRole(ctx.user.id);
      await movimentarEstoque(
        tenantId,
        input.pecaId,
        input.tipo,
        input.quantidade,
        ctx.user.id,
        input.osId,
        input.observacao
      );
      return { success: true };
    }),
});
