import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createEquipamento,
  getEquipamentoById,
  getEquipamentos,
  getTenantByMember,
  getTenantByOwner,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { validateIMEI } from "../../shared/utils";

async function resolveTenantId(userId: number): Promise<number> {
  const owned = await getTenantByOwner(userId);
  if (owned) return owned.id;
  const member = await getTenantByMember(userId);
  if (member) return member.id;
  throw new TRPCError({ code: "FORBIDDEN", message: "Você não pertence a nenhuma empresa" });
}

const IMEI_REQUIRED_CATEGORIES = ["smartphone", "tablet"] as const;

export const equipamentosRouter = router({
  list: protectedProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);
      return getEquipamentos(tenantId, input.search);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);
      const eq = await getEquipamentoById(tenantId, input.id);
      if (!eq) throw new TRPCError({ code: "NOT_FOUND" });
      return eq;
    }),

  create: protectedProcedure
    .input(
      z.object({
        clienteId: z.number(),
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
        marca: z.string().min(1).max(100),
        modelo: z.string().min(1).max(100),
        numeroSerie: z.string().max(100).optional(),
        imei: z.string().max(15).optional(),
        capacidade: z.string().max(50).optional(),
        cor: z.string().max(50).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);

      // IMEI validation
      if (IMEI_REQUIRED_CATEGORIES.includes(input.categoria as any)) {
        if (!input.imei) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "IMEI é obrigatório para smartphones e tablets",
          });
        }
        if (!validateIMEI(input.imei)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "IMEI inválido (deve ter 15 dígitos)" });
        }
      }

      return createEquipamento(tenantId, input);
    }),
});
