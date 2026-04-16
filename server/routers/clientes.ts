import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createCliente,
  getClienteById,
  getClientes,
  getTenantByMember,
  getTenantByOwner,
  updateCliente,
  getEquipamentosByCliente,
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

const clienteInputBase = z.object({
  tipo: z.enum(["pf", "pj"]),
  nome: z.string().min(2).max(255),
  cpfCnpj: z.string().optional(),
  inscricaoEstadual: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().max(2).optional(),
  // Campos inteligentes
  origemCliente: z.enum(["indicacao", "google", "redes_sociais", "passante", "outro"]).optional(),
  preferenciaContato: z.enum(["whatsapp", "email", "ligacao"]).optional(),
  horarioPreferidoContato: z.string().max(50).optional(),
  classificacao: z.enum(["padrao", "vip", "recorrente", "inadimplente"]).optional(),
  observacoesInternas: z.string().optional(),
  aceitouTermos: z.boolean().optional(),
});

function validateDoc(cpfCnpj?: string) {
  if (!cpfCnpj) return;
  const cleaned = cpfCnpj.replace(/\D/g, "");
  const valid = cleaned.length === 11 ? validateCPF(cleaned) : validateCNPJ(cleaned);
  if (!valid) throw new TRPCError({ code: "BAD_REQUEST", message: "CPF/CNPJ inválido" });
}

export const clientesRouter = router({
  list: protectedProcedure
    .input(z.object({ search: z.string().optional(), classificacao: z.string().optional() }))
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

  getEquipamentos: protectedProcedure
    .input(z.object({ clienteId: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);
      return getEquipamentosByCliente(tenantId, input.clienteId);
    }),

  create: protectedProcedure
    .input(clienteInputBase)
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);
      validateDoc(input.cpfCnpj);
      const aceitouTermosAt = input.aceitouTermos ? new Date() : undefined;
      return createCliente(tenantId, { ...input, aceitouTermosAt });
    }),

  update: protectedProcedure
    .input(clienteInputBase.partial().extend({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);
      const { id, ...data } = input;
      validateDoc(data.cpfCnpj);
      const updates: Record<string, unknown> = { ...data };
      if (data.aceitouTermos === true) updates.aceitouTermosAt = new Date();
      await updateCliente(tenantId, id, updates as any);
      return { success: true };
    }),
});
