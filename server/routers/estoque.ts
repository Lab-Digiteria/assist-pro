import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createPeca,
  getDb,
  getEquipmentModels,
  getPecasWithModels,
  getTenantByMember,
  getTenantByOwner,
  movimentarEstoque,
  syncPecaCompatibleModels,
  updatePeca,
} from "../db";
import { pecas } from "../../drizzle/schema";
import { and, eq, or, like, sql } from "drizzle-orm";
import { lookupPartNumber } from "../nexar";
import { protectedProcedure, router } from "../_core/trpc";

async function resolveTenantAndRole(userId: number) {
  const owned = await getTenantByOwner(userId);
  if (owned) return { tenantId: owned.id, role: "manager" as const };
  const member = await getTenantByMember(userId);
  if (member) return { tenantId: member.id, role: (member as any).memberRole as string };
  throw new TRPCError({ code: "FORBIDDEN" });
}

const CATEGORIAS = ["tela", "bateria", "conector", "cabo", "placa", "chip", "acessorio", "outro"] as const;

/** Gera um código SKU no formato SKU-XXXXXX (alfanumérico maiúsculo) */
function generateSkuCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "SKU-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/** Verifica se um SKU já existe para o tenant (excluindo uma peça específica) */
async function skuExistsForTenant(tenantId: number, sku: string, excludeId?: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const rows = await db
    .select({ id: pecas.id })
    .from(pecas)
    .where(
      and(
        eq(pecas.tenantId, tenantId),
        eq(pecas.sku, sku),
        excludeId ? sql`${pecas.id} != ${excludeId}` : sql`1=1`
      )
    )
    .limit(1);
  return rows.length > 0;
}

export const estoqueRouter = router({
  /** Busca informações de uma peça pelo Part Number via API do Nexar */
  lookupPartNumber: protectedProcedure
    .input(z.object({ partNumber: z.string().min(1) }))
    .query(async ({ input }) => {
      try {
        return await lookupPartNumber(input.partNumber);
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err?.message || "Erro ao consultar Nexar",
        });
      }
    }),

  /** Gera um código SKU único para o tenant */
  generateSku: protectedProcedure.mutation(async ({ ctx }) => {
    const { tenantId } = await resolveTenantAndRole(ctx.user.id);
    let sku = generateSkuCode();
    let attempts = 0;
    while ((await skuExistsForTenant(tenantId, sku)) && attempts < 10) {
      sku = generateSkuCode();
      attempts++;
    }
    return { sku };
  }),

  list: protectedProcedure
    .input(
      z.object({
        compatibleModelId: z.number().optional(),
        search: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = await resolveTenantAndRole(ctx.user.id);
      const search = input?.search?.trim();

      if (search) {
        const db = await getDb();
        if (!db) return [];
        const rows = await db
          .select()
          .from(pecas)
          .where(
            and(
              eq(pecas.tenantId, tenantId),
              or(
                like(pecas.nome, `%${search}%`),
                like(pecas.partNumber, `%${search}%`),
                like(pecas.sku, `%${search}%`),
                like(pecas.codigo, `%${search}%`)
              )
            )
          )
          // Prioriza match exato de SKU ou PN no topo
          .orderBy(
            sql`CASE WHEN ${pecas.sku} = ${search} THEN 0 WHEN ${pecas.partNumber} = ${search} THEN 1 ELSE 2 END`
          );
        return rows.map((p) => ({ ...p, compatibleModelIds: [] }));
      }

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
        sku: z.string().max(50).optional(),
        compatibleModelIds: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = await resolveTenantAndRole(ctx.user.id);
      const { compatibleModelIds, precoCusto, precoVenda, sku, ...rest } = input;

      // Validar unicidade do SKU por tenant
      if (sku && sku.trim()) {
        const exists = await skuExistsForTenant(tenantId, sku.trim());
        if (exists) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `O SKU "${sku}" já está em uso por outra peça.`,
          });
        }
      }

      const peca = await createPeca(tenantId, {
        ...rest,
        sku: sku?.trim() || undefined,
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
        sku: z.string().max(50).nullable().optional(),
        compatibleModelIds: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, role } = await resolveTenantAndRole(ctx.user.id);
      const { id, precoCusto, precoVenda, compatibleModelIds, sku, ...rest } = input;

      // Validar unicidade do SKU por tenant (excluindo a própria peça)
      if (sku && sku.trim()) {
        const exists = await skuExistsForTenant(tenantId, sku.trim(), id);
        if (exists) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `O SKU "${sku}" já está em uso por outra peça.`,
          });
        }
      }

      const data: Record<string, unknown> = { ...rest };
      if (sku !== undefined) data.sku = sku?.trim() || null;
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
