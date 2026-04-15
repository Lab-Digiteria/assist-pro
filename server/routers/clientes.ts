import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createCliente,
  getClienteById,
  getClientes,
  getTenantByMember,
  getTenantByOwner,
  updateCliente,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { validateCNPJ, validateCPF } from "../../shared/utils";

async function resolveTenantId(userId: number): Promise<number> {
  const owned = await getTenantByOwner(userId);
  if (owned) return owned.id;
  const member = await getTenantByMember(userId);
  if (member) return member.id;
  throw new TRPCError({ code: "FORBIDDEN", message: "Você não pertence a nenhuma empresa" });
}

export const clientesRouter = router({
  list: protectedProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);
      return getClientes(tenantId, input.search);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);
      const cliente = await getClienteById(tenantId, input.id);
      if (!cliente) throw new TRPCError({ code: "NOT_FOUND" });
      return cliente;
    }),

  create: protectedProcedure
    .input(
      z.object({
        tipo: z.enum(["pf", "pj"]),
        nome: z.string().min(2).max(255),
        cpfCnpj: z.string().optional(),
        inscricaoEstadual: z.string().optional(),
        whatsapp: z.string().optional(),
        email: z.string().email().optional(),
        cep: z.string().optional(),
        logradouro: z.string().optional(),
        numero: z.string().optional(),
        complemento: z.string().optional(),
        bairro: z.string().optional(),
        cidade: z.string().optional(),
        estado: z.string().max(2).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);

      if (input.cpfCnpj) {
        const cleaned = input.cpfCnpj.replace(/\D/g, "");
        const valid = cleaned.length === 11 ? validateCPF(cleaned) : validateCNPJ(cleaned);
        if (!valid) throw new TRPCError({ code: "BAD_REQUEST", message: "CPF/CNPJ inválido" });
      }

      return createCliente(tenantId, input);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        tipo: z.enum(["pf", "pj"]).optional(),
        nome: z.string().min(2).max(255).optional(),
        cpfCnpj: z.string().optional(),
        inscricaoEstadual: z.string().optional(),
        whatsapp: z.string().optional(),
        email: z.string().email().optional(),
        cep: z.string().optional(),
        logradouro: z.string().optional(),
        numero: z.string().optional(),
        complemento: z.string().optional(),
        bairro: z.string().optional(),
        cidade: z.string().optional(),
        estado: z.string().max(2).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);
      const { id, ...data } = input;

      if (data.cpfCnpj) {
        const cleaned = data.cpfCnpj.replace(/\D/g, "");
        const valid = cleaned.length === 11 ? validateCPF(cleaned) : validateCNPJ(cleaned);
        if (!valid) throw new TRPCError({ code: "BAD_REQUEST", message: "CPF/CNPJ inválido" });
      }

      await updateCliente(tenantId, id, data);
      return { success: true };
    }),
});
