import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createPeca,
  getEquipmentModels,
  getPecasWithModels,
  getTenantByMember,
  getTenantByOwner,
  movimentarEstoque,
  syncPecaCompatibleModels,
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

const CATEGORIAS = ["tela", "bateria", "conector", "cabo", "placa", "chip", "acessorio", "outro"] as const;

export const estoqueRouter = router({
  list: protectedProcedure
    .input(z.object({ compatibleModelId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const { tenantId } = await resolveTenantAndRole(ctx.user.id);
      return getPecasWithModels(tenantId, input?.compatibleModelId);
    }),

  /** Lista os modelos de equipamentos do tenant para uso no multi-select */
  listModels: protectedProcedure.query(async ({ ctx }) => {
    const { tenantId } = await resolveTenantAndRole(ctx.user.id);
    return getEquipmentModels(tenantId);
  }),

  create: protectedProcedure
    .input(
      z.object({
        nome: z.string().min(1).max(255),
        categoria: z.enum(CATEGORIAS),
        precoCusto: z.number().optional(),
        precoVenda: z.number().min(0),
        quantidadeAtual: z.number().min(0).default(0),
        quantidadeMinima: z.number().min(0).default(1),
        partNumber: z.string().max(100).optional(),
        manufacturer: z.string().max(150).optional(),
        application: z.string().optional(),
        compatibleModelIds: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = await resolveTenantAndRole(ctx.user.id);
      const { compatibleModelIds, precoCusto, precoVenda, ...rest } = input;
      const peca = await createPeca(tenantId, {
        ...rest,
        precoCusto: precoCusto !== undefined ? String(precoCusto) : undefined,
        precoVenda: String(precoVenda),
      });
      if (peca && compatibleModelIds && compatibleModelIds.length > 0) {
        await syncPecaCompatibleModels(peca.id, compatibleModelIds);
      }
      return peca;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        nome: z.string().optional(),
        categoria: z.enum(CATEGORIAS).optional(),
        precoCusto: z.number().optional(),
        precoVenda: z.number().optional(),
        quantidadeMinima: z.number().optional(),
        partNumber: z.string().max(100).nullable().optional(),
        manufacturer: z.string().max(150).nullable().optional(),
        application: z.string().nullable().optional(),
        compatibleModelIds: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, role } = await resolveTenantAndRole(ctx.user.id);
      const { id, precoCusto, precoVenda, compatibleModelIds, ...rest } = input;
      const data: Record<string, unknown> = { ...rest };
      if (precoVenda !== undefined) data.precoVenda = String(precoVenda);
      if (precoCusto !== undefined && (role === "manager" || ctx.user.role === "admin")) {
        data.precoCusto = String(precoCusto);
      }
      await updatePeca(tenantId, id, data as any);
      if (compatibleModelIds !== undefined) {
        await syncPecaCompatibleModels(id, compatibleModelIds);
      }
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
