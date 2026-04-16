import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createListaCompra,
  deleteListaCompra,
  getListaCompraById,
  getListaCompras,
  getTenantByMember,
  getTenantByOwner,
  movimentarEstoque,
  updateListaCompra,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

async function resolveTenant(userId: number) {
  const owned = await getTenantByOwner(userId);
  if (owned) return owned.id;
  const member = await getTenantByMember(userId);
  if (member) return member.id;
  throw new TRPCError({ code: "FORBIDDEN" });
}

const REASONS = ["os_demand", "stock_replenishment", "other"] as const;
const PRIORITIES = ["low", "medium", "high"] as const;
const STATUSES = ["pending", "ordered", "received"] as const;

export const listaComprasRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(STATUSES).optional(),
        priority: z.enum(PRIORITIES).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const tenantId = await resolveTenant(ctx.user.id);
      return getListaCompras(tenantId, input);
    }),

  create: protectedProcedure
    .input(
      z.object({
        itemDescription: z.string().min(1).max(500),
        partNumber: z.string().max(100).optional(),
        quantityNeeded: z.number().min(1).default(1),
        reason: z.enum(REASONS).default("stock_replenishment"),
        priority: z.enum(PRIORITIES).default("medium"),
        pecaId: z.number().optional(),
        serviceOrderId: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenant(ctx.user.id);
      return createListaCompra(tenantId, input);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        itemDescription: z.string().min(1).max(500).optional(),
        quantityNeeded: z.number().min(1).optional(),
        reason: z.enum(REASONS).optional(),
        priority: z.enum(PRIORITIES).optional(),
        pecaId: z.number().nullable().optional(),
        serviceOrderId: z.number().nullable().optional(),
        notes: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenant(ctx.user.id);
      const { id, ...data } = input;
      await updateListaCompra(tenantId, id, data as any);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenant(ctx.user.id);
      await deleteListaCompra(tenantId, input.id);
      return { success: true };
    }),

  /** Marca como "Pedido Realizado" */
  markOrdered: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenant(ctx.user.id);
      const item = await getListaCompraById(tenantId, input.id);
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });
      if (item.status === "received") throw new TRPCError({ code: "BAD_REQUEST", message: "Item já recebido." });
      await updateListaCompra(tenantId, input.id, { status: "ordered" });
      return { success: true };
    }),

  /** Marca como "Recebido" e opcionalmente dá entrada no estoque */
  markReceived: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        addToStock: z.boolean().default(false),
        quantityReceived: z.number().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenant(ctx.user.id);
      const item = await getListaCompraById(tenantId, input.id);
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });

      await updateListaCompra(tenantId, input.id, { status: "received" });

      // Entrada automática no estoque se solicitado e peça vinculada
      if (input.addToStock && item.pecaId) {
        const qty = input.quantityReceived ?? item.quantityNeeded;
        await movimentarEstoque(
          tenantId,
          item.pecaId,
          "entrada",
          qty,
          ctx.user.id,
          undefined,
          `Entrada via Lista de Compras #${item.id}`
        );
      }

      return { success: true };
    }),
});
