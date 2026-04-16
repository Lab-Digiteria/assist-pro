import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getEquipmentModels,
  createEquipmentModel,
  updateEquipmentModel,
  deleteEquipmentModel,
} from "../db";
import { EQUIPMENT_CATEGORIES } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

const CATEGORIES = EQUIPMENT_CATEGORIES as unknown as [string, ...string[]];

export const equipmentModelsRouter = router({
  list: protectedProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.tenantId;
      if (!tenantId) throw new TRPCError({ code: "UNAUTHORIZED" });
      return getEquipmentModels(tenantId, input.search);
    }),

  create: protectedProcedure
    .input(
      z.object({
        brand: z.string().min(1).max(100),
        modelName: z.string().min(1).max(200),
        category: z.enum(CATEGORIES as [string, ...string[]] as [typeof EQUIPMENT_CATEGORIES[number], ...typeof EQUIPMENT_CATEGORIES[number][]]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.tenantId;
      if (!tenantId) throw new TRPCError({ code: "UNAUTHORIZED" });
      return createEquipmentModel(tenantId, input);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        brand: z.string().min(1).max(100).optional(),
        modelName: z.string().min(1).max(200).optional(),
        category: z.enum(CATEGORIES as [string, ...string[]] as [typeof EQUIPMENT_CATEGORIES[number], ...typeof EQUIPMENT_CATEGORIES[number][]]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.tenantId;
      if (!tenantId) throw new TRPCError({ code: "UNAUTHORIZED" });
      const { id, ...data } = input;
      await updateEquipmentModel(tenantId, id, data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.tenantId;
      if (!tenantId) throw new TRPCError({ code: "UNAUTHORIZED" });
      await deleteEquipmentModel(tenantId, input.id);
      return { success: true };
    }),
});
