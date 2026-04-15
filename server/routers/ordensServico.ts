import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  addOsItem,
  addOsLancamento,
  createOrdemServico,
  getOrdemServicoById,
  getOrdensServico,
  getOsItens,
  getOsLancamentos,
  getOsStatusHistory,
  getTenantByMember,
  getTenantByOwner,
  removeOsItem,
  updateOrdemServico,
  updateOrdemServicoStatus,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

async function resolveTenantId(userId: number): Promise<number> {
  const owned = await getTenantByOwner(userId);
  if (owned) return owned.id;
  const member = await getTenantByMember(userId);
  if (member) return member.id;
  throw new TRPCError({ code: "FORBIDDEN", message: "Você não pertence a nenhuma empresa" });
}

export const ordensServicoRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);
      return getOrdensServico(tenantId, input);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);
      const os = await getOrdemServicoById(tenantId, input.id);
      if (!os) throw new TRPCError({ code: "NOT_FOUND" });
      return os;
    }),

  create: protectedProcedure
    .input(
      z.object({
        clienteId: z.number(),
        equipamentoId: z.number(),
        tecnicoId: z.number().optional(),
        prazoOrcamento: z.string().optional(), // ISO date string
        descricaoProblema: z.string().optional(),
        checklistEstadoFisico: z.record(z.string(), z.any()).optional(),
        checklistSintomas: z.record(z.string(), z.any()).optional(),
        senhaDesbloqueio: z.string().optional(),
        acessoriosEntregues: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);
      return createOrdemServico(tenantId, {
        clienteId: input.clienteId,
        equipamentoId: input.equipamentoId,
        tecnicoId: input.tecnicoId,
        prazoOrcamento: input.prazoOrcamento ? new Date(input.prazoOrcamento) : undefined,
        descricaoProblema: input.descricaoProblema,
        checklistEstadoFisico: (input.checklistEstadoFisico ?? null) as any,
        checklistSintomas: (input.checklistSintomas ?? null) as any,
        senhaDesbloqueio: input.senhaDesbloqueio,
        acessoriosEntregues: (input.acessoriosEntregues ?? null) as any,
      });
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum([
          "recebido",
          "em_diagnostico",
          "aguardando_aprovacao",
          "em_reparo",
          "concluido",
          "pronto_aguardando_retirada",
          "encerrado",
          "cancelado",
          "devolvido_sem_reparo",
        ]),
        observacao: z.string().optional(),
        tipoEncerramento: z
          .enum(["com_pagamento_total", "com_saldo_devedor", "sem_reparo", "devolucao"])
          .optional(),
        temGarantia: z.boolean().optional(),
        garantiaDias: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);

      if (input.tipoEncerramento || input.temGarantia !== undefined) {
        await updateOrdemServico(tenantId, input.id, {
          tipoEncerramento: input.tipoEncerramento,
          temGarantia: input.temGarantia,
          garantiaDias: input.garantiaDias ?? 90,
        });
      }

      await updateOrdemServicoStatus(
        tenantId,
        input.id,
        input.status,
        ctx.user.id,
        input.observacao
      );
      return { success: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        tecnicoId: z.number().optional(),
        prazoOrcamento: z.string().optional(),
        descricaoProblema: z.string().optional(),
        observacoesInternas: z.string().optional(),
        checklistEstadoFisico: z.record(z.string(), z.any()).optional(),
        checklistSintomas: z.record(z.string(), z.any()).optional(),
        senhaDesbloqueio: z.string().optional(),
        acessoriosEntregues: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);
      const { id, ...data } = input;
      const updates: Record<string, unknown> = {};
      if (data.tecnicoId !== undefined) updates.tecnicoId = data.tecnicoId;
      if (data.descricaoProblema !== undefined) updates.descricaoProblema = data.descricaoProblema;
      if (data.observacoesInternas !== undefined) updates.observacoesInternas = data.observacoesInternas;
      if (data.senhaDesbloqueio !== undefined) updates.senhaDesbloqueio = data.senhaDesbloqueio;
      if (data.checklistEstadoFisico !== undefined) updates.checklistEstadoFisico = data.checklistEstadoFisico;
      if (data.checklistSintomas !== undefined) updates.checklistSintomas = data.checklistSintomas;
      if (data.acessoriosEntregues !== undefined) updates.acessoriosEntregues = data.acessoriosEntregues;
      if (data.prazoOrcamento) updates.prazoOrcamento = new Date(data.prazoOrcamento);
      await updateOrdemServico(tenantId, id, updates as any);
      return { success: true };
    }),

  // Items
  itens: protectedProcedure
    .input(z.object({ osId: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);
      return getOsItens(tenantId, input.osId);
    }),

  addItem: protectedProcedure
    .input(
      z.object({
        osId: z.number(),
        tipo: z.enum(["servico", "peca"]),
        descricao: z.string().min(1),
        pecaId: z.number().optional(),
        quantidade: z.number().min(1),
        valorUnitario: z.number().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);
      const { osId, ...data } = input;
      await addOsItem(tenantId, osId, data);
      return { success: true };
    }),

  removeItem: protectedProcedure
    .input(z.object({ itemId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);
      await removeOsItem(tenantId, input.itemId);
      return { success: true };
    }),

  // Lançamentos financeiros
  lancamentos: protectedProcedure
    .input(z.object({ osId: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);
      return getOsLancamentos(tenantId, input.osId);
    }),

  addLancamento: protectedProcedure
    .input(
      z.object({
        osId: z.number(),
        tipo: z.enum(["sinal", "antecipacao", "pagamento_final", "estorno"]),
        formaPagamento: z.enum([
          "dinheiro",
          "pix",
          "cartao_debito",
          "cartao_credito",
          "faturamento_direto",
        ]),
        valor: z.number().min(0.01),
        observacao: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);
      const { osId, ...data } = input;
      await addOsLancamento(tenantId, osId, { ...data, userId: ctx.user.id });
      return { success: true };
    }),

  // History
  history: protectedProcedure
    .input(z.object({ osId: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);
      return getOsStatusHistory(tenantId, input.osId);
    }),
});
