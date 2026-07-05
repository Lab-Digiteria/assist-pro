import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { encryptField } from "../_core/crypto";
import {
  addOsFieldAudit,
  addOsItem,
  addOsLancamento,
  addOsPhoto,
  createOrdemServico,
  deleteOsPhoto,
  getOrdemServicoById,
  getOrdensServico,
  getOsByClientToken,
  getOsFieldAudit,
  getOsItens,
  getOsLancamentos,
  getOsPhotos,
  getOsStatusHistory,
  getTenantByMember,
  getTenantByOwner,
  removeOsItem,
  updateOsItem,
  updateCliente,
  updateOrdemServico,
  updateOrdemServicoStatus,
  updateOsClientToken,
  reservarEstoquePeca,
  liberarReservaEstoque,
  liberarTodasReservasOs,
  confirmarTodasSaidasOs,
} from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";
import { notifyOwner } from "../_core/notification";
import { buildOrcamentoEmail, sendEmail } from "../email";
import { getDb } from "../db";
import { clientes, tenants, equipamentos } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

async function resolveTenantId(userId: number): Promise<number> {
  const owned = await getTenantByOwner(userId);
  if (owned) return owned.id;
  const member = await getTenantByMember(userId);
  if (member) return member.id;
  throw new TRPCError({ code: "FORBIDDEN", message: "Você não pertence a nenhuma empresa" });
}

// Campos auditáveis da OS (label legível)
const AUDITABLE_FIELDS: Record<string, string> = {
  laudoTecnico: "Laudo técnico",
  descricaoProblema: "Descrição do problema",
  observacoesInternas: "Observações internas",
  tecnicoId: "Técnico responsável",
  prazoOrcamento: "Prazo do orçamento",
  numeroLacre: "Número do lacre",
  semSolucaoPossivel: "Sem solução possível",
  justificativaSemSolucao: "Justificativa sem solução",
  descontoValor: "Desconto",
  prazoEstimadoConclusao: "Prazo estimado de conclusão",
  validadeOrcamento: "Validade do orçamento",
};

export const ordensServicoRouter = router({
  list: protectedProcedure
    .input(z.object({ status: z.string().optional(), search: z.string().optional() }))
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
        attendantId: z.number().optional(),
        prazoOrcamento: z.string().optional(),
        descricaoProblema: z.string().optional(),
        checklistEstadoFisico: z.record(z.string(), z.any()).optional(),
        checklistSintomas: z.record(z.string(), z.any()).optional(),
        senhaDesbloqueio: z.string().optional(),
        acessoriosEntregues: z.array(z.string()).optional(),
        laudoTecnico: z.string().optional(),
        numeroLacre: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);
      // Generate client token on creation
      const clientToken = randomUUID();
      const clientTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      // Cifra AES-256-GCM (reversível) — substitui bcrypt que era irreversível
      const senhaCifrada = input.senhaDesbloqueio
        ? encryptField(input.senhaDesbloqueio)
        : undefined;
      return createOrdemServico(tenantId, {
        clienteId: input.clienteId,
        equipamentoId: input.equipamentoId,
        tecnicoId: input.tecnicoId,
        attendantId: input.attendantId,
        prazoOrcamento: input.prazoOrcamento ? new Date(input.prazoOrcamento) : undefined,
        descricaoProblema: input.descricaoProblema,
        checklistEstadoFisico: (input.checklistEstadoFisico ?? null) as any,
        checklistSintomas: (input.checklistSintomas ?? null) as any,
        senhaDesbloqueio: senhaCifrada,
        acessoriosEntregues: (input.acessoriosEntregues ?? null) as any,
        laudoTecnico: input.laudoTecnico,
        numeroLacre: input.numeroLacre,
        clientToken,
        clientTokenExpiresAt,
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
      // Sincronizar estoque ao avançar para em_reparo (reserva → saída efetiva)
      if (input.status === "em_reparo") {
        const os = await getOrdemServicoById(tenantId, input.id);
        if (os) await confirmarTodasSaidasOs(tenantId, input.id, os.numero, ctx.user.id);
      }
      // Liberar todas as reservas ao cancelar OS
      if (input.status === "cancelado" || input.status === "devolvido_sem_reparo") {
        const os = await getOrdemServicoById(tenantId, input.id);
        if (os) await liberarTodasReservasOs(tenantId, input.id, os.numero, ctx.user.id);
      }
      await updateOrdemServicoStatus(tenantId, input.id, input.status, ctx.user.id, input.observacao);
      // Auto-mark client as inadimplente when OS is closed with outstanding balance
      if (input.tipoEncerramento === "com_saldo_devedor") {
        const os = await getOrdemServicoById(tenantId, input.id);
        if (os?.clienteId) {
          await updateCliente(tenantId, os.clienteId, { classificacao: "inadimplente" });
        }
      }
      return { success: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        tecnicoId: z.number().optional(),
        attendantId: z.number().optional(),
        prazoOrcamento: z.string().optional(),
        descricaoProblema: z.string().optional(),
        observacoesInternas: z.string().optional(),
        checklistEstadoFisico: z.record(z.string(), z.any()).optional(),
        checklistSintomas: z.record(z.string(), z.any()).optional(),
        senhaDesbloqueio: z.string().optional(),
        acessoriosEntregues: z.array(z.string()).optional(),
        // Novos campos de segurança
        laudoTecnico: z.string().optional(),
        numeroLacre: z.string().optional(),
        semSolucaoPossivel: z.boolean().optional(),
        justificativaSemSolucao: z.string().optional(),
        descontoValor: z.number().optional(),
        prazoEstimadoConclusao: z.string().optional(),
        validadeOrcamento: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);
      const { id, ...data } = input;
      const current = await getOrdemServicoById(tenantId, id);
      if (!current) throw new TRPCError({ code: "NOT_FOUND" });

      const updates: Record<string, unknown> = {};
      const auditEntries: Array<{ campo: string; valorAnterior?: string | null; valorNovo?: string | null }> = [];

      const track = (field: string, newVal: unknown) => {
        const oldVal = (current as any)[field];
        const oldStr = oldVal != null ? String(oldVal) : null;
        const newStr = newVal != null ? String(newVal) : null;
        if (oldStr !== newStr) {
          auditEntries.push({ campo: AUDITABLE_FIELDS[field] ?? field, valorAnterior: oldStr, valorNovo: newStr });
          updates[field] = newVal;
        }
      };

      if (data.tecnicoId !== undefined) track("tecnicoId", data.tecnicoId);
      if (data.attendantId !== undefined) updates.attendantId = data.attendantId;
      if (data.descricaoProblema !== undefined) track("descricaoProblema", data.descricaoProblema);
      if (data.observacoesInternas !== undefined) updates.observacoesInternas = data.observacoesInternas;
      // Cifra AES-256-GCM (reversível) — substitui bcrypt que era irreversível
      if (data.senhaDesbloqueio !== undefined) {
        updates.senhaDesbloqueio = data.senhaDesbloqueio
          ? encryptField(data.senhaDesbloqueio)
          : null;
      }
      if (data.checklistEstadoFisico !== undefined) updates.checklistEstadoFisico = data.checklistEstadoFisico;
      if (data.checklistSintomas !== undefined) updates.checklistSintomas = data.checklistSintomas;
      if (data.acessoriosEntregues !== undefined) updates.acessoriosEntregues = data.acessoriosEntregues;
      if (data.prazoOrcamento) track("prazoOrcamento", new Date(data.prazoOrcamento));
      if (data.laudoTecnico !== undefined) track("laudoTecnico", data.laudoTecnico);
      if (data.numeroLacre !== undefined) track("numeroLacre", data.numeroLacre);
      if (data.semSolucaoPossivel !== undefined) track("semSolucaoPossivel", data.semSolucaoPossivel);
      if (data.justificativaSemSolucao !== undefined) track("justificativaSemSolucao", data.justificativaSemSolucao);
      if (data.descontoValor !== undefined) track("descontoValor", data.descontoValor);
      if (data.prazoEstimadoConclusao) track("prazoEstimadoConclusao", new Date(data.prazoEstimadoConclusao));
      if (data.validadeOrcamento) track("validadeOrcamento", new Date(data.validadeOrcamento));

      if (Object.keys(updates).length > 0) {
        await updateOrdemServico(tenantId, id, updates as any);
      }
      if (auditEntries.length > 0) {
        await addOsFieldAudit(tenantId, id, auditEntries.map((e) => ({
          ...e,
          userId: ctx.user.id,
          userName: ctx.user.name ?? undefined,
        })));
      }
      return { success: true };
    }),

  // Fotos
  photos: protectedProcedure
    .input(z.object({ osId: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);
      return getOsPhotos(tenantId, input.osId);
    }),

  uploadPhoto: protectedProcedure
    .input(
      z.object({
        osId: z.number(),
        tipo: z.enum(["entrada", "saida", "laudo"]),
        base64: z.string(), // base64 encoded image
        mimeType: z.string().default("image/jpeg"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);
      const buffer = Buffer.from(input.base64, "base64");
      if (buffer.length > 10 * 1024 * 1024) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Imagem muito grande (máx 10MB)" });
      }
      const ext = input.mimeType.split("/")[1] ?? "jpg";
      const fileKey = `tenants/${tenantId}/os/${input.osId}/photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType);
      await addOsPhoto(tenantId, input.osId, {
        url,
        fileKey,
        tipo: input.tipo,
        uploadedBy: ctx.user.id,
      });
      return { url, fileKey };
    }),

  deletePhoto: protectedProcedure
    .input(z.object({ photoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);
      await deleteOsPhoto(tenantId, input.photoId);
      return { success: true };
    }),

  // Assinatura digital
  saveSignature: protectedProcedure
    .input(
      z.object({
        osId: z.number(),
        base64: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);
      const buffer = Buffer.from(input.base64, "base64");
      const fileKey = `tenants/${tenantId}/os/${input.osId}/signature-${Date.now()}.png`;
      const { url } = await storagePut(fileKey, buffer, "image/png");
      await updateOrdemServico(tenantId, input.osId, { assinaturaClienteUrl: url });
      return { url };
    }),

  // Auditoria de campos
  fieldAudit: protectedProcedure
    .input(z.object({ osId: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);
      return getOsFieldAudit(tenantId, input.osId);
    }),

  // Regenerar token do cliente
  regenerateClientToken: protectedProcedure
    .input(z.object({ osId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);
      const os = await getOrdemServicoById(tenantId, input.osId);
      if (!os) throw new TRPCError({ code: "NOT_FOUND" });
      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await updateOsClientToken(input.osId, token, expiresAt);
      return { token };
    }),

  // ── ÁREA DO CLIENTE (rotas públicas por token) ──────────────────────────────
  getByClientToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const os = await getOsByClientToken(input.token);
      if (!os) throw new TRPCError({ code: "NOT_FOUND", message: "OS não encontrada ou link expirado" });
      // Return only client-safe fields (never expose internal notes, cost, password)
      return {
        id: os.id,
        numero: os.numero,
        status: os.status,
        statusOrcamento: os.statusOrcamento,
        descricaoProblema: os.descricaoProblema,
        laudoTecnico: os.laudoTecnico,
        valorTotal: os.valorTotal,
        descontoValor: os.descontoValor,
        prazoEstimadoConclusao: os.prazoEstimadoConclusao,
        validadeOrcamento: os.validadeOrcamento,
        motivoReprovacao: os.motivoReprovacao,
        clientObservacoes: os.clientObservacoes,
        dataNotificacaoCliente: os.dataNotificacaoCliente,
        createdAt: os.createdAt,
        updatedAt: os.updatedAt,
        tenantId: os.tenantId,
        clienteId: os.clienteId,
        equipamentoId: os.equipamentoId,
      };
    }),

  clientApproveQuote: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const os = await getOsByClientToken(input.token);
      if (!os) throw new TRPCError({ code: "NOT_FOUND", message: "OS não encontrada ou link expirado" });
      if (os.statusOrcamento !== "pendente") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Orçamento já foi respondido" });
      }
      await updateOrdemServico(os.tenantId, os.id, { statusOrcamento: "aprovado" });
      await notifyOwner({
        title: `✅ Orçamento aprovado — OS ${os.numero}`,
        content: `O cliente aprovou o orçamento da OS ${os.numero}.`,
      }).catch(() => {});
      return { success: true };
    }),

  clientRejectQuote: publicProcedure
    .input(z.object({ token: z.string(), motivo: z.string().min(5).max(500) }))
    .mutation(async ({ input }) => {
      const os = await getOsByClientToken(input.token);
      if (!os) throw new TRPCError({ code: "NOT_FOUND", message: "OS não encontrada ou link expirado" });
      if (os.statusOrcamento !== "pendente") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Orçamento já foi respondido" });
      }
      await updateOrdemServico(os.tenantId, os.id, {
        statusOrcamento: "reprovado",
        motivoReprovacao: input.motivo,
      });
      await notifyOwner({
        title: `❌ Orçamento reprovado — OS ${os.numero}`,
        content: `O cliente reprovou o orçamento da OS ${os.numero}. Motivo: ${input.motivo}`,
      }).catch(() => {});
      return { success: true };
    }),

  clientAddObservation: publicProcedure
    .input(z.object({ token: z.string(), observacao: z.string().min(1).max(1000) }))
    .mutation(async ({ input }) => {
      const os = await getOsByClientToken(input.token);
      if (!os) throw new TRPCError({ code: "NOT_FOUND", message: "OS não encontrada ou link expirado" });
      await updateOrdemServico(os.tenantId, os.id, { clientObservacoes: input.observacao });
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
        descricaoTecnica: z.string().optional(),
        pecaId: z.number().optional(),
        supplierId: z.number().optional(),
        quantidade: z.number().min(1),
        valorUnitario: z.number().min(0),
        valorCusto: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);
      const { osId, ...data } = input;
      // Reservar estoque se for peça cadastrada
      if (data.tipo === "peca" && data.pecaId) {
        const os = await getOrdemServicoById(tenantId, osId);
        if (!os) throw new TRPCError({ code: "NOT_FOUND" });
        await reservarEstoquePeca(tenantId, data.pecaId, data.quantidade, osId, os.numero, ctx.user.id);
      }
      await addOsItem(tenantId, osId, { ...data, estoqueReservado: data.tipo === "peca" && !!data.pecaId });
      return { success: true };
    }),

  removeItem: protectedProcedure
    .input(z.object({ itemId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);
      // Liberar reserva se o item era peça com estoque reservado
      const db = await getDb();
      if (db) {
        const { osItens: osItensTable } = await import("../../drizzle/schema");
        const [item] = await db.select().from(osItensTable).where(and(eq(osItensTable.id, input.itemId), eq(osItensTable.tenantId, tenantId))).limit(1);
        if (item?.tipo === "peca" && item.pecaId && item.estoqueReservado) {
          const os = await getOrdemServicoById(tenantId, item.osId);
          if (os) await liberarReservaEstoque(tenantId, item.pecaId, item.quantidade, item.osId, os.numero, ctx.user.id);
        }
      }
      await removeOsItem(tenantId, input.itemId);
      return { success: true };
    }),

  updateItem: protectedProcedure
    .input(
      z.object({
        itemId: z.number(),
        descricao: z.string().min(1).optional(),
        descricaoTecnica: z.string().optional(),
        quantidade: z.number().min(1).optional(),
        valorUnitario: z.number().min(0).optional(),
        valorCusto: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);
      const { itemId, ...data } = input;
      await updateOsItem(tenantId, itemId, data);
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

  // Reenviar e-mail de orçamento para o cliente
  reenviarEmailOrcamento: protectedProcedure
    .input(z.object({ osId: z.number(), origin: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenantId(ctx.user.id);
      const os = await getOrdemServicoById(tenantId, input.osId);
      if (!os) throw new TRPCError({ code: "NOT_FOUND", message: "OS não encontrada" });
      if (!os.clientToken) throw new TRPCError({ code: "BAD_REQUEST", message: "OS sem token de cliente" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponível" });
      const [cliente] = os.clienteId
        ? await db.select().from(clientes).where(and(eq(clientes.id, os.clienteId), eq(clientes.tenantId, tenantId))).limit(1)
        : [];
      if (!cliente?.email) throw new TRPCError({ code: "BAD_REQUEST", message: "Cliente sem e-mail cadastrado" });
      const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
      const equipRows = os.equipamentoId
        ? await db.select().from(equipamentos).where(and(eq(equipamentos.id, os.equipamentoId), eq(equipamentos.tenantId, tenantId))).limit(1)
        : [];
      const equipDescricao = equipRows[0] ? `${equipRows[0].marca} ${equipRows[0].modelo}` : "Equipamento";
      const aprovarUrl = `${input.origin}/api/orcamento/aprovar?token=${os.clientToken}`;
      const rejeitarUrl = `${input.origin}/api/orcamento/rejeitar?token=${os.clientToken}`;
      const { subject, html } = buildOrcamentoEmail({
        clienteNome: cliente.nome,
        osNumero: os.numero ?? `#${os.id}`,
        equipamentoDescricao: equipDescricao,
        tenantNome: (tenant as any)?.name ?? "Assistência Técnica",
        tenantWhatsapp: (tenant as any)?.whatsapp ?? undefined,
        valorTotal: parseFloat(String(os.valorTotal ?? "0")),
        laudoTecnico: os.laudoTecnico ?? undefined,
        aprovarUrl,
        rejeitarUrl,
        validadeOrcamento: os.validadeOrcamento ?? undefined,
      });
      await sendEmail({ to: cliente.email, subject, html });
      return { success: true, sentTo: cliente.email };
    }),
});
