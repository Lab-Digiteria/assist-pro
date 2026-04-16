/**
 * orcamento-email-routes.ts
 * Rotas GET públicas para aprovação/rejeição de orçamento diretamente pelo e-mail.
 * O cliente clica no link do e-mail → ação é executada → redirecionamento para página de confirmação.
 *
 * GET /api/orcamento/aprovar?token=XXX
 * GET /api/orcamento/rejeitar?token=XXX&motivo=...
 */
import { Express } from "express";
import { getDb } from "./db";
import { ordensServico, clientes, tenants, equipamentos } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

export function registerOrcamentoEmailRoutes(app: Express) {
  // ── Aprovar orçamento via link do e-mail ─────────────────────────────────────
  app.get("/api/orcamento/aprovar", async (req, res) => {
    const token = req.query.token as string | undefined;
    if (!token) {
      return res.redirect("/orcamento/erro?msg=token_invalido");
    }

    try {
      const db = await getDb();
      if (!db) return res.redirect("/orcamento/erro?msg=servico_indisponivel");

      // Buscar OS pelo clientToken
      const [os] = await db
        .select()
        .from(ordensServico)
        .where(eq(ordensServico.clientToken, token))
        .limit(1);

      if (!os) return res.redirect("/orcamento/erro?msg=os_nao_encontrada");
      if (os.clientTokenExpiresAt && os.clientTokenExpiresAt < new Date()) {
        return res.redirect("/orcamento/erro?msg=link_expirado");
      }
      if (os.statusOrcamento !== "pendente") {
        // Já respondido — redirecionar para página informativa
        const jaAprovado = os.statusOrcamento === "aprovado";
        return res.redirect(`/orcamento/${jaAprovado ? "aprovado" : "rejeitado"}?token=${token}&ja_respondido=1`);
      }

      // Aprovar orçamento
      await db
        .update(ordensServico)
        .set({ statusOrcamento: "aprovado", updatedAt: new Date() })
        .where(and(eq(ordensServico.id, os.id), eq(ordensServico.tenantId, os.tenantId)));

      // Notificar o dono da assistência
      notifyOwner({
        title: `✅ Orçamento aprovado — OS ${os.numero ?? `#${os.id}`}`,
        content: `O cliente aprovou o orçamento da OS ${os.numero ?? `#${os.id}`} via e-mail.`,
      }).catch(() => {});

      return res.redirect(`/orcamento/aprovado?token=${token}`);
    } catch (err) {
      console.error("[OrcamentoEmail] Erro ao aprovar:", err);
      return res.redirect("/orcamento/erro?msg=erro_interno");
    }
  });

  // ── Rejeitar orçamento via link do e-mail ────────────────────────────────────
  app.get("/api/orcamento/rejeitar", async (req, res) => {
    const token = req.query.token as string | undefined;
    const motivo = (req.query.motivo as string | undefined) ?? "";

    if (!token) {
      return res.redirect("/orcamento/erro?msg=token_invalido");
    }

    // Se não tem motivo, redirecionar para página de rejeição onde o cliente digita o motivo
    if (!motivo.trim()) {
      return res.redirect(`/orcamento/rejeitar?token=${token}`);
    }

    try {
      const db = await getDb();
      if (!db) return res.redirect("/orcamento/erro?msg=servico_indisponivel");

      const [os] = await db
        .select()
        .from(ordensServico)
        .where(eq(ordensServico.clientToken, token))
        .limit(1);

      if (!os) return res.redirect("/orcamento/erro?msg=os_nao_encontrada");
      if (os.clientTokenExpiresAt && os.clientTokenExpiresAt < new Date()) {
        return res.redirect("/orcamento/erro?msg=link_expirado");
      }
      if (os.statusOrcamento !== "pendente") {
        const jaAprovado = os.statusOrcamento === "aprovado";
        return res.redirect(`/orcamento/${jaAprovado ? "aprovado" : "rejeitado"}?token=${token}&ja_respondido=1`);
      }

      // Rejeitar orçamento
      await db
        .update(ordensServico)
        .set({
          statusOrcamento: "reprovado",
          motivoReprovacao: motivo.slice(0, 500),
          updatedAt: new Date(),
        })
        .where(and(eq(ordensServico.id, os.id), eq(ordensServico.tenantId, os.tenantId)));

      // Notificar o dono da assistência
      notifyOwner({
        title: `❌ Orçamento rejeitado — OS ${os.numero ?? `#${os.id}`}`,
        content: `O cliente rejeitou o orçamento da OS ${os.numero ?? `#${os.id}`} via e-mail. Motivo: ${motivo}`,
      }).catch(() => {});

      return res.redirect(`/orcamento/rejeitado?token=${token}`);
    } catch (err) {
      console.error("[OrcamentoEmail] Erro ao rejeitar:", err);
      return res.redirect("/orcamento/erro?msg=erro_interno");
    }
  });

  // ── Dados da OS para a página de confirmação ─────────────────────────────────
  app.get("/api/orcamento/info", async (req, res) => {
    const token = req.query.token as string | undefined;
    if (!token) return res.status(400).json({ error: "token_invalido" });

    try {
      const db = await getDb();
      if (!db) return res.status(503).json({ error: "servico_indisponivel" });

      const [os] = await db
        .select()
        .from(ordensServico)
        .where(eq(ordensServico.clientToken, token))
        .limit(1);

      if (!os) return res.status(404).json({ error: "os_nao_encontrada" });

      const [tenant] = await db
        .select({ name: tenants.name })
        .from(tenants)
        .where(eq(tenants.id, os.tenantId))
        .limit(1);

      const [cliente] = os.clienteId
        ? await db
            .select({ nome: clientes.nome })
            .from(clientes)
            .where(and(eq(clientes.id, os.clienteId), eq(clientes.tenantId, os.tenantId)))
            .limit(1)
        : [];

      const equipRows = os.equipamentoId
        ? await db
            .select({ marca: equipamentos.marca, modelo: equipamentos.modelo })
            .from(equipamentos)
            .where(and(eq(equipamentos.id, os.equipamentoId), eq(equipamentos.tenantId, os.tenantId)))
            .limit(1)
        : [];

      return res.json({
        numero: os.numero,
        statusOrcamento: os.statusOrcamento,
        valorTotal: os.valorTotal,
        tenantNome: tenant?.name ?? "Assistência Técnica",
        clienteNome: cliente?.nome ?? "Cliente",
        equipamento: equipRows[0] ? `${equipRows[0].marca} ${equipRows[0].modelo}` : "Equipamento",
      });
    } catch (err) {
      console.error("[OrcamentoEmail] Erro ao buscar info:", err);
      return res.status(500).json({ error: "erro_interno" });
    }
  });
}
