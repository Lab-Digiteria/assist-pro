import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  caixaLancamentos,
  clientes,
  comissoesTecnicos,
  emailCampaigns,
  equipamentos,
  equipmentModels,
  estoqueMovimentacoes,
  InsertUser,
  leads,
  ordensServico,
  osFieldAudit,
  osItens,
  osLancamentos,
  osPhotos,
  osStatusHistory,
  listaCompras,
  suppliers,
  pecaModeloCompativel,
  pecas,
  tenantMembers,
  tenants,
  users,
  type EQUIPMENT_CATEGORIES,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { generateOsNumber, generatePartCode, generateSlug } from "../shared/utils";
import { buildOsProntaEmail, buildOrcamentoEmail, sendEmail } from "./email";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── USERS ───────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── TENANTS ─────────────────────────────────────────────────────────────────
export async function getTenantByOwner(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(tenants).where(eq(tenants.ownerUserId, userId)).limit(1);
  return result[0] ?? null;
}

export async function getTenantByMember(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const members = await db
    .select()
    .from(tenantMembers)
    .where(eq(tenantMembers.userId, userId))
    .limit(1);
  if (!members[0]) return null;
  const result = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, members[0].tenantId))
    .limit(1);
  return result[0] ? { ...result[0], memberRole: members[0].role } : null;
}

export async function createTenant(data: {
  name: string;
  ownerUserId: number;
  cpfCnpj?: string;
  whatsapp?: string;
  email?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  let slug = generateSlug(data.name);
  // ensure unique slug
  const existing = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
  if (existing[0]) slug = `${slug}-${Date.now()}`;

  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  await db.insert(tenants).values({
    name: data.name,
    slug,
    ownerUserId: data.ownerUserId,
    cpfCnpj: data.cpfCnpj,
    whatsapp: data.whatsapp,
    email: data.email,
    subscriptionStatus: "trial",
    trialEndsAt,
    osCounter: 0,
  });

  const result = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);
  return result[0];
}

export async function getAllTenants() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tenants).orderBy(desc(tenants.createdAt));
}

export async function updateTenantStatus(
  tenantId: number,
  status: "trial" | "active" | "past_due" | "suspended" | "canceled" | "expired"
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(tenants)
    .set({ subscriptionStatus: status })
    .where(eq(tenants.id, tenantId));
}

export async function updateTenantStripe(
  tenantId: number,
  data: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    stripePriceId?: string;
    planType?: "monthly" | "annual" | "lifetime";
    subscriptionStatus?: "trial" | "active" | "past_due" | "suspended" | "canceled" | "expired";
    subscriptionEndsAt?: Date | null;
  }
) {
  const db = await getDb();
  if (!db) return;
  await db.update(tenants).set(data).where(eq(tenants.id, tenantId));
}

// ─── TENANT MEMBERS ──────────────────────────────────────────────────────────
export async function getTenantMembers(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: tenantMembers.id,
      userId: tenantMembers.userId,
      role: tenantMembers.role,
      createdAt: tenantMembers.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(tenantMembers)
    .leftJoin(users, eq(tenantMembers.userId, users.id))
    .where(eq(tenantMembers.tenantId, tenantId));
}

export async function addTenantMember(
  tenantId: number,
  userId: number,
  role: "manager" | "technician" | "viewer"
) {
  const db = await getDb();
  if (!db) return;
  await db.insert(tenantMembers).values({ tenantId, userId, role });
}

export async function updateMemberRole(
  memberId: number,
  role: "manager" | "technician" | "viewer"
) {
  const db = await getDb();
  if (!db) return;
  await db.update(tenantMembers).set({ role }).where(eq(tenantMembers.id, memberId));
}

export async function removeTenantMember(memberId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(tenantMembers).where(eq(tenantMembers.id, memberId));
}

// ─── LEADS ───────────────────────────────────────────────────────────────────
export async function getAllLeads() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leads).orderBy(desc(leads.createdAt));
}

export async function createLead(data: {
  name: string;
  email?: string;
  whatsapp?: string;
  cpfCnpj?: string;
  source?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(leads).values({ ...data, status: "new" });
}

export async function updateLeadStatus(
  leadId: number,
  status: "new" | "contacted" | "trial" | "converted" | "churned" | "lost",
  tenantId?: number
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(leads)
    .set({ status, tenantId: tenantId ?? null })
    .where(eq(leads.id, leadId));
}

// ─── CLIENTES ────────────────────────────────────────────────────────────────
export async function getClientes(tenantId: number, search?: string) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(clientes)
    .where(eq(clientes.tenantId, tenantId))
    .orderBy(desc(clientes.createdAt));
  if (!search) return rows;
  const q = search.toLowerCase();
  return rows.filter(
    (c) =>
      c.nome.toLowerCase().includes(q) ||
      (c.cpfCnpj ?? "").includes(q) ||
      (c.whatsapp ?? "").includes(q)
  );
}

export async function getClienteById(tenantId: number, id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(clientes)
    .where(and(eq(clientes.id, id), eq(clientes.tenantId, tenantId)))
    .limit(1);
  return result[0] ?? null;
}

export async function createCliente(
  tenantId: number,
  data: Omit<typeof clientes.$inferInsert, "id" | "tenantId" | "createdAt" | "updatedAt">
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(clientes).values({ ...data, tenantId });
  const result = await db
    .select()
    .from(clientes)
    .where(eq(clientes.tenantId, tenantId))
    .orderBy(desc(clientes.createdAt))
    .limit(1);
  return result[0];
}

export async function updateCliente(
  tenantId: number,
  id: number,
  data: Partial<typeof clientes.$inferInsert>
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(clientes)
    .set(data)
    .where(and(eq(clientes.id, id), eq(clientes.tenantId, tenantId)));
}

// ─── EQUIPAMENTOS ────────────────────────────────────────────────────────────
export async function getEquipamentos(tenantId: number, search?: string) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: equipamentos.id,
      tenantId: equipamentos.tenantId,
      clienteId: equipamentos.clienteId,
      categoria: equipamentos.categoria,
      marca: equipamentos.marca,
      modelo: equipamentos.modelo,
      numeroSerie: equipamentos.numeroSerie,
      imei: equipamentos.imei,
      capacidade: equipamentos.capacidade,
      cor: equipamentos.cor,
      createdAt: equipamentos.createdAt,
      clienteNome: clientes.nome,
    })
    .from(equipamentos)
    .leftJoin(clientes, eq(equipamentos.clienteId, clientes.id))
    .where(eq(equipamentos.tenantId, tenantId))
    .orderBy(desc(equipamentos.createdAt));
  if (!search) return rows;
  const q = search.toLowerCase();
  return rows.filter(
    (e) =>
      e.marca.toLowerCase().includes(q) ||
      e.modelo.toLowerCase().includes(q) ||
      (e.imei ?? "").includes(q) ||
      (e.numeroSerie ?? "").includes(q) ||
      (e.clienteNome ?? "").toLowerCase().includes(q)
  );
}

export async function getEquipamentoById(tenantId: number, id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(equipamentos)
    .where(and(eq(equipamentos.id, id), eq(equipamentos.tenantId, tenantId)))
    .limit(1);
  return result[0] ?? null;
}

export async function createEquipamento(
  tenantId: number,
  data: Omit<typeof equipamentos.$inferInsert, "id" | "tenantId" | "createdAt" | "updatedAt">
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(equipamentos).values({ ...data, tenantId });
  const result = await db
    .select()
    .from(equipamentos)
    .where(eq(equipamentos.tenantId, tenantId))
    .orderBy(desc(equipamentos.createdAt))
    .limit(1);
  return result[0];
}

// ─── ORDENS DE SERVIÇO ───────────────────────────────────────────────────────
export async function getOrdensServico(tenantId: number, filters?: {
  status?: string;
  tecnicoId?: number;
  search?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: ordensServico.id,
      tenantId: ordensServico.tenantId,
      numero: ordensServico.numero,
      status: ordensServico.status,
      prazoOrcamento: ordensServico.prazoOrcamento,
      dataNotificacaoCliente: ordensServico.dataNotificacaoCliente,
      tipoEncerramento: ordensServico.tipoEncerramento,
      temGarantia: ordensServico.temGarantia,
      dataFimGarantia: ordensServico.dataFimGarantia,
      valorTotal: ordensServico.valorTotal,
      valorPago: ordensServico.valorPago,
      comissaoCalculada: ordensServico.comissaoCalculada,
      createdAt: ordensServico.createdAt,
      updatedAt: ordensServico.updatedAt,
      clienteId: ordensServico.clienteId,
      equipamentoId: ordensServico.equipamentoId,
      tecnicoId: ordensServico.tecnicoId,
      clienteNome: clientes.nome,
      equipamentoMarca: equipamentos.marca,
      equipamentoModelo: equipamentos.modelo,
      equipamentoCategoria: equipamentos.categoria,
    })
    .from(ordensServico)
    .leftJoin(clientes, eq(ordensServico.clienteId, clientes.id))
    .leftJoin(equipamentos, eq(ordensServico.equipamentoId, equipamentos.id))
    .where(eq(ordensServico.tenantId, tenantId))
    .orderBy(desc(ordensServico.createdAt));

  let result = rows;
  if (filters?.status) result = result.filter((r) => r.status === filters.status);
  if (filters?.tecnicoId) result = result.filter((r) => r.tecnicoId === filters.tecnicoId);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (r) =>
        r.numero.toLowerCase().includes(q) ||
        (r.clienteNome ?? "").toLowerCase().includes(q) ||
        (r.equipamentoMarca ?? "").toLowerCase().includes(q)
    );
  }
  return result;
}

export async function getOrdemServicoById(tenantId: number, id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select({
      // OS fields
      id: ordensServico.id,
      tenantId: ordensServico.tenantId,
      numero: ordensServico.numero,
      status: ordensServico.status,
      clienteId: ordensServico.clienteId,
      equipamentoId: ordensServico.equipamentoId,
      tecnicoId: ordensServico.tecnicoId,
      attendantId: ordensServico.attendantId,
      descricaoProblema: ordensServico.descricaoProblema,
      laudoTecnico: ordensServico.laudoTecnico,
      senhaDesbloqueio: ordensServico.senhaDesbloqueio,
      acessoriosEntregues: ordensServico.acessoriosEntregues,
      checklistEstadoFisico: ordensServico.checklistEstadoFisico,
      checklistSintomas: ordensServico.checklistSintomas,
      valorTotal: ordensServico.valorTotal,
      valorPago: ordensServico.valorPago,
      descontoValor: ordensServico.descontoValor,
      statusOrcamento: ordensServico.statusOrcamento,
      motivoReprovacao: ordensServico.motivoReprovacao,
      prazoOrcamento: ordensServico.prazoOrcamento,
      prazoEstimadoConclusao: ordensServico.prazoEstimadoConclusao,
      validadeOrcamento: ordensServico.validadeOrcamento,
      dataNotificacaoCliente: ordensServico.dataNotificacaoCliente,
      dataFimGarantia: ordensServico.dataFimGarantia,
      temGarantia: ordensServico.temGarantia,
      garantiaDias: ordensServico.garantiaDias,
      numeroLacre: ordensServico.numeroLacre,
      semSolucaoPossivel: ordensServico.semSolucaoPossivel,
      justificativaSemSolucao: ordensServico.justificativaSemSolucao,
      assinaturaClienteUrl: ordensServico.assinaturaClienteUrl,
      clientToken: ordensServico.clientToken,
      clientTokenExpiresAt: ordensServico.clientTokenExpiresAt,
      clientObservacoes: ordensServico.clientObservacoes,
      createdAt: ordensServico.createdAt,
      updatedAt: ordensServico.updatedAt,
      // Cliente fields (prefixed)
      clienteNome: clientes.nome,
      clienteTipo: clientes.tipo,
      clienteCpfCnpj: clientes.cpfCnpj,
      clienteWhatsapp: clientes.whatsapp,
      clienteEmail: clientes.email,
      clienteClassificacao: clientes.classificacao,
      // Equipamento fields (prefixed)
      equipamentoCategoria: equipamentos.categoria,
      equipamentoMarca: equipamentos.marca,
      equipamentoModelo: equipamentos.modelo,
      equipamentoNumeroSerie: equipamentos.numeroSerie,
      equipamentoImei: equipamentos.imei,
      equipamentoCapacidade: equipamentos.capacidade,
      equipamentoCor: equipamentos.cor,
    })
    .from(ordensServico)
    .leftJoin(clientes, eq(ordensServico.clienteId, clientes.id))
    .leftJoin(equipamentos, eq(ordensServico.equipamentoId, equipamentos.id))
    .where(and(eq(ordensServico.id, id), eq(ordensServico.tenantId, tenantId)))
    .limit(1);
  return result[0] ?? null;
}

export async function createOrdemServico(
  tenantId: number,
  data: Omit<typeof ordensServico.$inferInsert, "id" | "tenantId" | "numero" | "createdAt" | "updatedAt">
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  // Increment counter atomically
  await db
    .update(tenants)
    .set({ osCounter: sql`${tenants.osCounter} + 1` })
    .where(eq(tenants.id, tenantId));

  const tenantRow = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  const counter = tenantRow[0]?.osCounter ?? 1;
  const numero = generateOsNumber(counter);

  await db.insert(ordensServico).values({ ...data, tenantId, numero, status: "recebido" });

  const result = await db
    .select()
    .from(ordensServico)
    .where(and(eq(ordensServico.tenantId, tenantId), eq(ordensServico.numero, numero)))
    .limit(1);
  return result[0];
}

export async function updateOrdemServicoStatus(
  tenantId: number,
  osId: number,
  newStatus: typeof ordensServico.$inferSelect["status"],
  userId: number,
  observacao?: string
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const os = await getOrdemServicoById(tenantId, osId);
  if (!os) throw new Error("OS não encontrada");

  const updates: Partial<typeof ordensServico.$inferInsert> = { status: newStatus };

  // Auto-fill dataNotificacaoCliente + disparar e-mail ao cliente
  if (newStatus === "pronto_aguardando_retirada" && !os.dataNotificacaoCliente) {
    updates.dataNotificacaoCliente = new Date();
    // Disparar e-mail de notificação ao cliente (não bloqueia o fluxo em caso de falha)
    try {
      const [cliente] = os.clienteId
        ? await db.select().from(clientes).where(and(eq(clientes.id, os.clienteId), eq(clientes.tenantId, tenantId))).limit(1)
        : [];
      const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
      if (cliente?.email) {
        const equipRows = os.equipamentoId
          ? await db.select().from(equipamentos).where(and(eq(equipamentos.id, os.equipamentoId), eq(equipamentos.tenantId, tenantId))).limit(1)
          : [];
        const equipDescricao = equipRows[0] ? `${equipRows[0].marca} ${equipRows[0].modelo}` : "Equipamento";
        const origin = (ENV as any).viteOauthPortalUrl?.replace(/\/login.*/, "") ?? "";
        const clientTokenUrl = os.clientToken ? `${origin}/os/acompanhar/${os.clientToken}` : undefined;
        const { subject, html } = buildOsProntaEmail({
          clienteNome: cliente.nome,
          osNumero: os.numero ?? `#${osId}`,
          equipamentoDescricao: equipDescricao,
          tenantNome: tenant?.name ?? "Assistência Técnica",
          tenantWhatsapp: (tenant as any)?.whatsapp ?? undefined,
          clientTokenUrl,
        });
        await sendEmail({ to: cliente.email, subject, html });
        console.log(`[OS] E-mail de notificação enviado para ${cliente.email} — OS #${osId}`);
      }
    } catch (emailErr) {
      console.error("[OS] Falha ao enviar e-mail de notificação:", emailErr);
    }
  }

  // Disparar e-mail de orçamento ao cliente quando status muda para aguardando_aprovacao
  if (newStatus === "aguardando_aprovacao") {
    try {
      const [cliente] = os.clienteId
        ? await db.select().from(clientes).where(and(eq(clientes.id, os.clienteId), eq(clientes.tenantId, tenantId))).limit(1)
        : [];
      const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
      if (cliente?.email && os.clientToken) {
        const equipRows = os.equipamentoId
          ? await db.select().from(equipamentos).where(and(eq(equipamentos.id, os.equipamentoId), eq(equipamentos.tenantId, tenantId))).limit(1)
          : [];
        const equipDescricao = equipRows[0] ? `${equipRows[0].marca} ${equipRows[0].modelo}` : "Equipamento";
        // Derivar a origin da URL do portal OAuth (remove /login...)
        const origin = (ENV as any).viteOauthPortalUrl?.replace(/\/login.*/, "") ?? "";
        const aprovarUrl = `${origin}/api/orcamento/aprovar?token=${os.clientToken}`;
        const rejeitarUrl = `${origin}/api/orcamento/rejeitar?token=${os.clientToken}`;
        const { subject, html } = buildOrcamentoEmail({
          clienteNome: cliente.nome,
          osNumero: os.numero ?? `#${osId}`,
          equipamentoDescricao: equipDescricao,
          tenantNome: tenant?.name ?? "Assistência Técnica",
          tenantWhatsapp: (tenant as any)?.whatsapp ?? undefined,
          valorTotal: parseFloat(String(os.valorTotal ?? "0")),
          laudoTecnico: os.laudoTecnico ?? undefined,
          aprovarUrl,
          rejeitarUrl,
          validadeOrcamento: os.validadeOrcamento ?? undefined,
        });
        await sendEmail({ to: cliente.email, subject, html });
        console.log(`[OS] E-mail de orçamento enviado para ${cliente.email} — OS #${osId}`);
      }
    } catch (emailErr) {
      console.error("[OS] Falha ao enviar e-mail de orçamento:", emailErr);
    }
  }
  // Auto-fill encerramento fields
  if (newStatus === "encerrado") {
    updates.dataEncerramento = new Date();
    if (os.temGarantia) {
      const days = os.garantiaDias ?? 90;
      updates.dataFimGarantia = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }
    // Clear password on encerramento
    updates.senhaDesbloqueio = null;
  }

  // Auto stock deduction on concluido — only on first transition to 'concluido'
  if (newStatus === "concluido" && os.status !== "concluido") {
    const pecaItems = await db
      .select()
      .from(osItens)
      .where(and(eq(osItens.osId, osId), eq(osItens.tenantId, tenantId), eq(osItens.tipo, "peca")));
    for (const item of pecaItems) {
      if (item.pecaId) {
        await movimentarEstoque(tenantId, item.pecaId, "saida", Number(item.quantidade), userId, osId, `Saída automática OS #${osId}`);
      }
    }
  }
  // Calculate commission on concluido
  if (newStatus === "concluido" && os.tecnicoId && os.equipamentoId) {
    const equip = await getEquipamentoById(tenantId, os.equipamentoId);
    if (equip) {
      const comissao = await db
        .select()
        .from(comissoesTecnicos)
        .where(
          and(
            eq(comissoesTecnicos.tenantId, tenantId),
            eq(comissoesTecnicos.tecnicoId, os.tecnicoId),
            eq(comissoesTecnicos.categoria, equip.categoria)
          )
        )
        .limit(1);
      if (comissao[0]) {
        const percentual = parseFloat(comissao[0].percentual ?? "0");
        const valorTotal = parseFloat(String(os.valorTotal ?? "0"));
        updates.comissaoCalculada = String((valorTotal * percentual) / 100);
      }
    }
  }

  await db
    .update(ordensServico)
    .set(updates)
    .where(and(eq(ordensServico.id, osId), eq(ordensServico.tenantId, tenantId)));

  // History
  await db.insert(osStatusHistory).values({
    osId,
    tenantId,
    statusAnterior: os.status,
    statusNovo: newStatus,
    userId,
    observacao,
  });
}

export async function updateOrdemServico(
  tenantId: number,
  osId: number,
  data: Partial<typeof ordensServico.$inferInsert>
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(ordensServico)
    .set(data)
    .where(and(eq(ordensServico.id, osId), eq(ordensServico.tenantId, tenantId)));
}

export async function getOsItens(tenantId: number, osId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: osItens.id,
      osId: osItens.osId,
      tenantId: osItens.tenantId,
      tipo: osItens.tipo,
      descricao: osItens.descricao,
      descricaoTecnica: osItens.descricaoTecnica,
      pecaId: osItens.pecaId,
      estoqueReservado: osItens.estoqueReservado,
      quantidade: osItens.quantidade,
      valorUnitario: osItens.valorUnitario,
      valorCusto: osItens.valorCusto,
      valorTotal: osItens.valorTotal,
      supplierId: osItens.supplierId,
      supplierName: sql<string | null>`${suppliers.tradeName}`,
      createdAt: osItens.createdAt,
    })
    .from(osItens)
    .leftJoin(suppliers, eq(osItens.supplierId, suppliers.id))
    .where(and(eq(osItens.osId, osId), eq(osItens.tenantId, tenantId)));
  return rows;
}

export async function addOsItem(
  tenantId: number,
  osId: number,
  data: { tipo: "servico" | "peca"; descricao: string; pecaId?: number; supplierId?: number; quantidade: number; valorUnitario: number; valorCusto?: number; estoqueReservado?: boolean }
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const valorTotal = data.quantidade * data.valorUnitario;
  await db.insert(osItens).values({
    osId,
    tenantId,
    tipo: data.tipo,
    descricao: data.descricao,
    pecaId: data.pecaId,
    supplierId: data.supplierId,
    estoqueReservado: data.estoqueReservado ?? false,
    quantidade: data.quantidade,
    valorUnitario: String(data.valorUnitario),
    valorCusto: data.valorCusto != null ? String(data.valorCusto) : undefined,
    valorTotal: String(valorTotal),
  });
  // Recalculate OS total
  await recalcOsTotal(tenantId, osId);
}

export async function removeOsItem(tenantId: number, itemId: number) {
  const db = await getDb();
  if (!db) return;
  const item = await db
    .select()
    .from(osItens)
    .where(and(eq(osItens.id, itemId), eq(osItens.tenantId, tenantId)))
    .limit(1);
  if (!item[0]) return;
  await db.delete(osItens).where(eq(osItens.id, itemId));
  await recalcOsTotal(tenantId, item[0].osId);
}

export async function updateOsItem(
  tenantId: number,
  itemId: number,
  data: { descricao?: string; descricaoTecnica?: string; quantidade?: number; valorUnitario?: number; valorCusto?: number }
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [item] = await db.select().from(osItens).where(and(eq(osItens.id, itemId), eq(osItens.tenantId, tenantId))).limit(1);
  if (!item) throw new Error("Item n\u00e3o encontrado");
  const novaQtd = data.quantidade ?? parseFloat(String(item.quantidade));
  const novoValorUnit = data.valorUnitario ?? parseFloat(String(item.valorUnitario));
  const novoTotal = novaQtd * novoValorUnit;
  const updates: Record<string, unknown> = { valorTotal: String(novoTotal) };
  if (data.descricao !== undefined) updates.descricao = data.descricao;
  if (data.descricaoTecnica !== undefined) updates.descricaoTecnica = data.descricaoTecnica;
  if (data.quantidade !== undefined) updates.quantidade = data.quantidade;
  if (data.valorUnitario !== undefined) updates.valorUnitario = String(data.valorUnitario);
  if (data.valorCusto !== undefined) updates.valorCusto = String(data.valorCusto);
  await db.update(osItens).set(updates as any).where(and(eq(osItens.id, itemId), eq(osItens.tenantId, tenantId)));
  await recalcOsTotal(tenantId, item.osId);
}

async function recalcOsTotal(tenantId: number, osId: number) {
  const db = await getDb();
  if (!db) return;
  const items = await db
    .select()
    .from(osItens)
    .where(and(eq(osItens.osId, osId), eq(osItens.tenantId, tenantId)));
  const total = items.reduce((sum, i) => sum + parseFloat(String(i.valorTotal)), 0);
  await db
    .update(ordensServico)
    .set({ valorTotal: String(total) })
    .where(and(eq(ordensServico.id, osId), eq(ordensServico.tenantId, tenantId)));
}

export async function getOsStatusHistory(tenantId: number, osId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(osStatusHistory)
    .where(and(eq(osStatusHistory.osId, osId), eq(osStatusHistory.tenantId, tenantId)))
    .orderBy(desc(osStatusHistory.createdAt));
}

// ─── LANÇAMENTOS FINANCEIROS ──────────────────────────────────────────────────
export async function getOsLancamentos(tenantId: number, osId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(osLancamentos)
    .where(and(eq(osLancamentos.osId, osId), eq(osLancamentos.tenantId, tenantId)))
    .orderBy(desc(osLancamentos.createdAt));
}

export async function addOsLancamento(
  tenantId: number,
  osId: number,
  data: {
    tipo: "sinal" | "antecipacao" | "pagamento_final" | "estorno";
    formaPagamento: "dinheiro" | "pix" | "cartao_debito" | "cartao_credito" | "faturamento_direto";
    valor: number;
    observacao?: string;
    userId: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  await db.insert(osLancamentos).values({
    osId,
    tenantId,
    tipo: data.tipo,
    formaPagamento: data.formaPagamento,
    valor: String(data.valor),
    observacao: data.observacao,
    userId: data.userId,
  });

  // Mirror to caixa
  const tipo = data.tipo === "estorno" ? "saida" : "entrada";
  await db.insert(caixaLancamentos).values({
    tenantId,
    tipo,
    descricao: `OS ${osId} - ${data.tipo}`,
    valor: String(data.valor),
    formaPagamento: data.formaPagamento,
    osId,
    userId: data.userId,
    manual: false,
  });

  // Update valorPago on OS
  const lancamentos = await db
    .select()
    .from(osLancamentos)
    .where(and(eq(osLancamentos.osId, osId), eq(osLancamentos.tenantId, tenantId)));
  const totalPago = lancamentos.reduce((sum, l) => {
    const v = parseFloat(String(l.valor));
    return l.tipo === "estorno" ? sum - v : sum + v;
  }, 0);
  await db
    .update(ordensServico)
    .set({ valorPago: String(totalPago) })
    .where(and(eq(ordensServico.id, osId), eq(ordensServico.tenantId, tenantId)));
}

// ─── CAIXA ───────────────────────────────────────────────────────────────────
export async function getCaixaLancamentos(
  tenantId: number,
  filters?: { from?: Date; to?: Date }
) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(caixaLancamentos.tenantId, tenantId)];
  if (filters?.from) conditions.push(gte(caixaLancamentos.createdAt, filters.from));
  if (filters?.to) conditions.push(lte(caixaLancamentos.createdAt, filters.to));
  return db
    .select()
    .from(caixaLancamentos)
    .where(and(...conditions))
    .orderBy(desc(caixaLancamentos.createdAt));
}

export async function addCaixaLancamentoManual(
  tenantId: number,
  data: {
    tipo: "entrada" | "saida";
    descricao: string;
    valor: number;
    formaPagamento?: string;
    userId: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(caixaLancamentos).values({
    tenantId,
    tipo: data.tipo,
    descricao: data.descricao,
    valor: String(data.valor),
    formaPagamento: data.formaPagamento as any,
    userId: data.userId,
    manual: true,
  });
}

// ─── ESTOQUE ─────────────────────────────────────────────────────────────────
export async function getPecas(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(pecas)
    .where(eq(pecas.tenantId, tenantId))
    .orderBy(desc(pecas.createdAt));
}

export async function createPeca(
  tenantId: number,
  data: Omit<typeof pecas.$inferInsert, "id" | "tenantId" | "codigo" | "createdAt" | "updatedAt">
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  // Generate code
  const count = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(pecas)
    .where(eq(pecas.tenantId, tenantId));
  const seq = (count[0]?.count ?? 0) + 1;
  const codigo = generatePartCode(seq);

  await db.insert(pecas).values({ ...data, tenantId, codigo });
  const result = await db
    .select()
    .from(pecas)
    .where(and(eq(pecas.tenantId, tenantId), eq(pecas.codigo, codigo)))
    .limit(1);
  return result[0];
}

export async function updatePeca(
  tenantId: number,
  id: number,
  data: Partial<typeof pecas.$inferInsert>
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(pecas)
    .set(data)
    .where(and(eq(pecas.id, id), eq(pecas.tenantId, tenantId)));
}

export async function movimentarEstoque(
  tenantId: number,
  pecaId: number,
  tipo: "entrada" | "saida" | "ajuste" | "devolucao",
  quantidade: number,
  userId: number,
  osId?: number,
  observacao?: string
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const peca = await db
    .select()
    .from(pecas)
    .where(and(eq(pecas.id, pecaId), eq(pecas.tenantId, tenantId)))
    .limit(1);
  if (!peca[0]) throw new Error("Peça não encontrada");

  const anterior = peca[0].quantidadeAtual;
  let nova = anterior;
  if (tipo === "entrada" || tipo === "devolucao") nova += quantidade;
  else if (tipo === "saida") nova -= quantidade;
  else nova = quantidade; // ajuste

  if (nova < 0) throw new Error("Estoque insuficiente");

  await db
    .update(pecas)
    .set({ quantidadeAtual: nova })
    .where(eq(pecas.id, pecaId));

  await db.insert(estoqueMovimentacoes).values({
    tenantId,
    pecaId,
    tipo,
    quantidade,
    quantidadeAnterior: anterior,
    quantidadeNova: nova,
    osId,
    observacao,
    userId,
  });
}

// ─── COMISSÕES ───────────────────────────────────────────────────────────────
export async function getComissoesTecnico(tenantId: number, tecnicoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(comissoesTecnicos)
    .where(
      and(eq(comissoesTecnicos.tenantId, tenantId), eq(comissoesTecnicos.tecnicoId, tecnicoId))
    );
}

export async function upsertComissaoTecnico(
  tenantId: number,
  tecnicoId: number,
  categoria: typeof comissoesTecnicos.$inferSelect["categoria"],
  percentual: number
) {
  const db = await getDb();
  if (!db) return;
  const existing = await db
    .select()
    .from(comissoesTecnicos)
    .where(
      and(
        eq(comissoesTecnicos.tenantId, tenantId),
        eq(comissoesTecnicos.tecnicoId, tecnicoId),
        eq(comissoesTecnicos.categoria, categoria)
      )
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(comissoesTecnicos)
      .set({ percentual: String(percentual) })
      .where(eq(comissoesTecnicos.id, existing[0].id));
  } else {
    await db.insert(comissoesTecnicos).values({
      tenantId,
      tecnicoId,
      categoria,
      percentual: String(percentual),
    });
  }
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
export async function getDashboardData(tenantId: number) {
  const db = await getDb();
  if (!db) return null;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // OS vencidas (prazo orçamento)
  const osVencidas = await db
    .select()
    .from(ordensServico)
    .where(
      and(
        eq(ordensServico.tenantId, tenantId),
        lte(ordensServico.prazoOrcamento, now),
        sql`${ordensServico.status} NOT IN ('encerrado','cancelado','devolvido_sem_reparo')`
      )
    );

  // OS aguardando retirada
  const osAguardandoRetirada = await db
    .select()
    .from(ordensServico)
    .where(
      and(
        eq(ordensServico.tenantId, tenantId),
        eq(ordensServico.status, "pronto_aguardando_retirada")
      )
    );

  // Peças abaixo do mínimo
  const pecasAbaixoMinimo = await db
    .select()
    .from(pecas)
    .where(
      and(
        eq(pecas.tenantId, tenantId),
        sql`${pecas.quantidadeAtual} < ${pecas.quantidadeMinima}`
      )
    );

  // OS por status
  const allOs = await db
    .select()
    .from(ordensServico)
    .where(eq(ordensServico.tenantId, tenantId));

  const osPorStatus: Record<string, number> = {};
  for (const os of allOs) {
    osPorStatus[os.status] = (osPorStatus[os.status] ?? 0) + 1;
  }

  // Faturamento hoje
  const lancamentosHoje = await db
    .select()
    .from(caixaLancamentos)
    .where(
      and(
        eq(caixaLancamentos.tenantId, tenantId),
        eq(caixaLancamentos.tipo, "entrada"),
        gte(caixaLancamentos.createdAt, startOfDay)
      )
    );
  const faturamentoHoje = lancamentosHoje.reduce((s, l) => s + parseFloat(String(l.valor)), 0);

  // Faturamento mês
  const lancamentosMes = await db
    .select()
    .from(caixaLancamentos)
    .where(
      and(
        eq(caixaLancamentos.tenantId, tenantId),
        eq(caixaLancamentos.tipo, "entrada"),
        gte(caixaLancamentos.createdAt, startOfMonth)
      )
    );
  const faturamentoMes = lancamentosMes.reduce((s, l) => s + parseFloat(String(l.valor)), 0);

  // Breakdown por forma de pagamento (mês)
  const breakdownPagamento: Record<string, number> = {};
  for (const l of lancamentosMes) {
    if (l.formaPagamento) {
      breakdownPagamento[l.formaPagamento] =
        (breakdownPagamento[l.formaPagamento] ?? 0) + parseFloat(String(l.valor));
    }
  }

  return {
    alertas: {
      osVencidas: osVencidas.map((o) => ({
        id: o.id,
        numero: o.numero,
        prazoOrcamento: o.prazoOrcamento,
        diasAtraso: o.prazoOrcamento
          ? Math.floor((now.getTime() - o.prazoOrcamento.getTime()) / 86400000)
          : 0,
      })),
      osAguardandoRetirada: osAguardandoRetirada.map((o) => ({
        id: o.id,
        numero: o.numero,
        dataNotificacaoCliente: o.dataNotificacaoCliente,
        diasEsperando: o.dataNotificacaoCliente
          ? Math.floor((now.getTime() - o.dataNotificacaoCliente.getTime()) / 86400000)
          : 0,
      })),
      pecasAbaixoMinimo: pecasAbaixoMinimo.map((p) => ({
        id: p.id,
        codigo: p.codigo,
        nome: p.nome,
        quantidadeAtual: p.quantidadeAtual,
        quantidadeMinima: p.quantidadeMinima,
      })),
    },
    osPorStatus,
    financeiro: { faturamentoHoje, faturamentoMes, breakdownPagamento },
    performance: {
      totalOsAbertas: allOs.filter(
        (o) => !["encerrado", "cancelado", "devolvido_sem_reparo"].includes(o.status)
      ).length,
    },
  };
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}


// ─── EQUIPAMENTOS POR CLIENTE ────────────────────────────────────────────────
export async function getEquipamentosByCliente(tenantId: number, clienteId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(equipamentos)
    .where(and(eq(equipamentos.tenantId, tenantId), eq(equipamentos.clienteId, clienteId)))
    .orderBy(desc(equipamentos.createdAt));
}

// ─── FOTOS DA OS ─────────────────────────────────────────────────────────────
export async function getOsPhotos(tenantId: number, osId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(osPhotos)
    .where(and(eq(osPhotos.tenantId, tenantId), eq(osPhotos.osId, osId)))
    .orderBy(osPhotos.createdAt);
}

export async function addOsPhoto(
  tenantId: number,
  osId: number,
  data: { url: string; fileKey: string; tipo: "entrada" | "saida" | "laudo"; uploadedBy?: number }
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(osPhotos).values({ ...data, tenantId, osId });
}

export async function deleteOsPhoto(tenantId: number, photoId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(osPhotos)
    .where(and(eq(osPhotos.id, photoId), eq(osPhotos.tenantId, tenantId)));
}

// ─── AUDITORIA DE CAMPOS DA OS ───────────────────────────────────────────────
export async function addOsFieldAudit(
  tenantId: number,
  osId: number,
  entries: Array<{ campo: string; valorAnterior?: string | null; valorNovo?: string | null; userId?: number; userName?: string }>
) {
  const db = await getDb();
  if (!db) return;
  if (entries.length === 0) return;
  await db.insert(osFieldAudit).values(
    entries.map((e) => ({ ...e, tenantId, osId }))
  );
}

export async function getOsFieldAudit(tenantId: number, osId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(osFieldAudit)
    .where(and(eq(osFieldAudit.tenantId, tenantId), eq(osFieldAudit.osId, osId)))
    .orderBy(desc(osFieldAudit.createdAt));
}

// ─── ÁREA DO CLIENTE (token público) ─────────────────────────────────────────
export async function getOsByClientToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(ordensServico)
    .where(eq(ordensServico.clientToken, token))
    .limit(1);
  const os = result[0];
  if (!os) return null;
  if (os.clientTokenExpiresAt && os.clientTokenExpiresAt < new Date()) return null;
  return os;
}

export async function updateOsClientToken(osId: number, token: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(ordensServico)
    .set({ clientToken: token, clientTokenExpiresAt: expiresAt })
    .where(eq(ordensServico.id, osId));
}

// ─── MODELOS DE EQUIPAMENTOS ─────────────────────────────────────────────────
export async function getEquipmentModels(tenantId: number, search?: string) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(equipmentModels)
    .where(eq(equipmentModels.tenantId, tenantId))
    .orderBy(equipmentModels.brand, equipmentModels.modelName);
  if (!search) return rows;
  const q = search.toLowerCase();
  return rows.filter(
    (m) =>
      m.brand.toLowerCase().includes(q) ||
      m.modelName.toLowerCase().includes(q)
  );
}

export async function createEquipmentModel(
  tenantId: number,
  data: { brand: string; modelName: string; category: typeof EQUIPMENT_CATEGORIES[number] }
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(equipmentModels).values({ ...data, tenantId });
  const result = await db
    .select()
    .from(equipmentModels)
    .where(eq(equipmentModels.tenantId, tenantId))
    .orderBy(desc(equipmentModels.createdAt))
    .limit(1);
  return result[0];
}

export async function updateEquipmentModel(
  tenantId: number,
  id: number,
  data: Partial<{ brand: string; modelName: string; category: typeof EQUIPMENT_CATEGORIES[number] }>
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(equipmentModels)
    .set(data)
    .where(and(eq(equipmentModels.id, id), eq(equipmentModels.tenantId, tenantId)));
}

export async function deleteEquipmentModel(tenantId: number, id: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(equipmentModels)
    .where(and(eq(equipmentModels.id, id), eq(equipmentModels.tenantId, tenantId)));
}

// ─── COMPATIBILIDADE PEÇA × MODELO ───────────────────────────────────────────

/** Retorna os IDs de modelos compatíveis com uma peça */
export async function getPecaCompatibleModels(pecaId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ equipmentModelId: pecaModeloCompativel.equipmentModelId })
    .from(pecaModeloCompativel)
    .where(eq(pecaModeloCompativel.pecaId, pecaId));
  return rows.map((r) => r.equipmentModelId);
}

/** Sincroniza os modelos compatíveis de uma peça (substitui todos) */
export async function syncPecaCompatibleModels(pecaId: number, modelIds: number[]) {
  const db = await getDb();
  if (!db) return;
  await db.delete(pecaModeloCompativel).where(eq(pecaModeloCompativel.pecaId, pecaId));
  if (modelIds.length > 0) {
    await db.insert(pecaModeloCompativel).values(
      modelIds.map((equipmentModelId) => ({ pecaId, equipmentModelId }))
    );
  }
}

/** Retorna peças de um tenant com seus modelos compatíveis */
export async function getPecasWithModels(tenantId: number, compatibleModelId?: number) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(pecas).where(eq(pecas.tenantId, tenantId)).$dynamic();

  const rows = await query.orderBy(desc(pecas.createdAt));

  // Buscar compatibilidades de todas as peças de uma vez
  const pecaIds = rows.map((p) => p.id);
  let compatMap: Record<number, number[]> = {};
  if (pecaIds.length > 0) {
    const compats = await db
      .select()
      .from(pecaModeloCompativel)
      .where(
        pecaIds.length === 1
          ? eq(pecaModeloCompativel.pecaId, pecaIds[0])
          : sql`${pecaModeloCompativel.pecaId} IN (${sql.join(pecaIds.map((id) => sql`${id}`), sql`, `)})`
      );
    for (const c of compats) {
      if (!compatMap[c.pecaId]) compatMap[c.pecaId] = [];
      compatMap[c.pecaId].push(c.equipmentModelId);
    }
  }

  const result = rows.map((p) => ({
    ...p,
    compatibleModelIds: compatMap[p.id] ?? [],
  }));

  // Filtrar por modelo compatível se solicitado
  if (compatibleModelId) {
    return result.filter((p) => p.compatibleModelIds.includes(compatibleModelId));
  }

  return result;
}

// ─── LISTA DE COMPRAS ─────────────────────────────────────────────────────────

export async function getListaCompras(
  tenantId: number,
  filters?: { status?: string; priority?: string }
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(listaCompras.tenantId, tenantId)];
  if (filters?.status) conditions.push(eq(listaCompras.status, filters.status as any));
  if (filters?.priority) conditions.push(eq(listaCompras.priority, filters.priority as any));

  return db
    .select({
      id: listaCompras.id,
      tenantId: listaCompras.tenantId,
      pecaId: listaCompras.pecaId,
      itemDescription: listaCompras.itemDescription,
      partNumber: listaCompras.partNumber,
      quantityNeeded: listaCompras.quantityNeeded,
      reason: listaCompras.reason,
      serviceOrderId: listaCompras.serviceOrderId,
      priority: listaCompras.priority,
      status: listaCompras.status,
      notes: listaCompras.notes,
      supplierId: listaCompras.supplierId,
      supplierName: sql<string | null>`${suppliers.tradeName}`,
      createdAt: listaCompras.createdAt,
      updatedAt: listaCompras.updatedAt,
    })
    .from(listaCompras)
    .leftJoin(suppliers, eq(listaCompras.supplierId, suppliers.id))
    .where(and(...conditions))
    .orderBy(
      sql`FIELD(${listaCompras.priority}, 'high', 'medium', 'low')`,
      desc(listaCompras.createdAt)
    );
}

export async function createListaCompra(
  tenantId: number,
  data: Omit<typeof listaCompras.$inferInsert, "id" | "tenantId" | "createdAt" | "updatedAt">
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(listaCompras).values({ ...data, tenantId });
  const rows = await db
    .select()
    .from(listaCompras)
    .where(eq(listaCompras.tenantId, tenantId))
    .orderBy(desc(listaCompras.createdAt))
    .limit(1);
  return rows[0];
}

export async function updateListaCompra(
  tenantId: number,
  id: number,
  data: Partial<typeof listaCompras.$inferInsert>
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(listaCompras)
    .set(data)
    .where(and(eq(listaCompras.id, id), eq(listaCompras.tenantId, tenantId)));
}

export async function deleteListaCompra(tenantId: number, id: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(listaCompras)
    .where(and(eq(listaCompras.id, id), eq(listaCompras.tenantId, tenantId)));
}

export async function getListaCompraById(tenantId: number, id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(listaCompras)
    .where(and(eq(listaCompras.id, id), eq(listaCompras.tenantId, tenantId)))
    .limit(1);
  return rows[0] ?? null;
}

// ─── RELATÓRIOS AVANÇADOS ─────────────────────────────────────────────────────

/**
 * Faturamento mensal dos últimos 12 meses (entradas no caixa)
 */
export async function getFaturamentoMensal12Meses(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  const meses: { label: string; mes: number; ano: number; valor: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    meses.push({ label: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }), mes: d.getMonth() + 1, ano: d.getFullYear(), valor: 0 });
  }
  const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const lancamentos = await db
    .select()
    .from(caixaLancamentos)
    .where(and(eq(caixaLancamentos.tenantId, tenantId), eq(caixaLancamentos.tipo, "entrada"), gte(caixaLancamentos.createdAt, startDate)));
  for (const l of lancamentos) {
    const d = new Date(l.createdAt!);
    const mes = d.getMonth() + 1;
    const ano = d.getFullYear();
    const entry = meses.find((m) => m.mes === mes && m.ano === ano);
    if (entry) entry.valor += parseFloat(String(l.valor));
  }
  return meses.map(({ label, valor }) => ({ label, valor: Math.round(valor * 100) / 100 }));
}

/**
 * Ranking de técnicos: OS concluídas + faturamento gerado
 */
export async function getRankingTecnicos(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  // Buscar membros técnicos do tenant
  const membros = await db
    .select({ userId: tenantMembers.userId, role: tenantMembers.role, userName: users.name })
    .from(tenantMembers)
    .leftJoin(users, eq(tenantMembers.userId, users.id))
    .where(eq(tenantMembers.tenantId, tenantId));
  // Buscar OS encerradas/concluídas com técnico e valor
  const osRows = await db
    .select({
      tecnicoId: ordensServico.tecnicoId,
      status: ordensServico.status,
      valorTotal: ordensServico.valorTotal,
    })
    .from(ordensServico)
    .where(and(eq(ordensServico.tenantId, tenantId), sql`${ordensServico.status} IN ('concluido','encerrado')`));
  // Agregar por técnico
  const map = new Map<number, { nome: string; osConcluidas: number; faturamento: number }>();
  for (const os of osRows) {
    if (!os.tecnicoId) continue;
    const membro = membros.find((m) => m.userId === os.tecnicoId);
    const nome = membro?.userName ?? `Técnico #${os.tecnicoId}`;
    const entry = map.get(os.tecnicoId) ?? { nome, osConcluidas: 0, faturamento: 0 };
    entry.osConcluidas += 1;
    entry.faturamento += parseFloat(String(os.valorTotal ?? "0"));
    map.set(os.tecnicoId, entry);
  }
  return Array.from(map.values())
    .sort((a, b) => b.osConcluidas - a.osConcluidas)
    .map((e) => ({ ...e, faturamento: Math.round(e.faturamento * 100) / 100 }));
}

// ─── RESERVA DE ESTOQUE (OS) ─────────────────────────────────────────────────
export async function reservarEstoquePeca(
  tenantId: number, pecaId: number, quantidade: number,
  osId: number, osNumero: string, userId: number
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [peca] = await db.select().from(pecas).where(and(eq(pecas.id, pecaId), eq(pecas.tenantId, tenantId))).limit(1);
  if (!peca) throw new Error("Peça não encontrada");
  const disponivel = peca.quantidadeAtual - peca.quantidadeReservada;
  if (disponivel < quantidade) throw new Error(`Estoque insuficiente. Disponível: ${disponivel}, solicitado: ${quantidade}`);
  await db.update(pecas).set({ quantidadeReservada: peca.quantidadeReservada + quantidade }).where(eq(pecas.id, pecaId));
  await db.insert(estoqueMovimentacoes).values({ tenantId, pecaId, tipo: "ajuste", quantidade, quantidadeAnterior: peca.quantidadeAtual, quantidadeNova: peca.quantidadeAtual, osId, observacao: `Reservado para OS ${osNumero}`, userId });
}

export async function liberarReservaEstoque(
  tenantId: number, pecaId: number, quantidade: number,
  osId: number, osNumero: string, userId: number
) {
  const db = await getDb();
  if (!db) return;
  const [peca] = await db.select().from(pecas).where(and(eq(pecas.id, pecaId), eq(pecas.tenantId, tenantId))).limit(1);
  if (!peca) return;
  const novaReserva = Math.max(0, peca.quantidadeReservada - quantidade);
  await db.update(pecas).set({ quantidadeReservada: novaReserva }).where(eq(pecas.id, pecaId));
  await db.insert(estoqueMovimentacoes).values({ tenantId, pecaId, tipo: "devolucao", quantidade, quantidadeAnterior: peca.quantidadeAtual, quantidadeNova: peca.quantidadeAtual, osId, observacao: `Reserva liberada — OS ${osNumero}`, userId });
}

export async function confirmarSaidaEstoque(
  tenantId: number, pecaId: number, quantidade: number,
  osId: number, osNumero: string, userId: number
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [peca] = await db.select().from(pecas).where(and(eq(pecas.id, pecaId), eq(pecas.tenantId, tenantId))).limit(1);
  if (!peca) throw new Error("Peça não encontrada");
  const novaQtd = peca.quantidadeAtual - quantidade;
  if (novaQtd < 0) throw new Error("Estoque insuficiente para confirmar saída");
  const novaReserva = Math.max(0, peca.quantidadeReservada - quantidade);
  await db.update(pecas).set({ quantidadeAtual: novaQtd, quantidadeReservada: novaReserva }).where(eq(pecas.id, pecaId));
  await db.insert(estoqueMovimentacoes).values({ tenantId, pecaId, tipo: "saida", quantidade, quantidadeAnterior: peca.quantidadeAtual, quantidadeNova: novaQtd, osId, observacao: `Saída confirmada — OS ${osNumero}`, userId });
}

export async function liberarTodasReservasOs(tenantId: number, osId: number, osNumero: string, userId: number) {
  const db = await getDb();
  if (!db) return;
  const itens = await db.select().from(osItens).where(and(eq(osItens.osId, osId), eq(osItens.tenantId, tenantId)));
  for (const item of itens) {
    if (item.tipo === "peca" && item.pecaId && item.estoqueReservado) {
      await liberarReservaEstoque(tenantId, item.pecaId, item.quantidade, osId, osNumero, userId);
      await db.update(osItens).set({ estoqueReservado: false }).where(eq(osItens.id, item.id));
    }
  }
}

export async function confirmarTodasSaidasOs(tenantId: number, osId: number, osNumero: string, userId: number) {
  const db = await getDb();
  if (!db) return;
  const itens = await db.select().from(osItens).where(and(eq(osItens.osId, osId), eq(osItens.tenantId, tenantId)));
  for (const item of itens) {
    if (item.tipo === "peca" && item.pecaId && item.estoqueReservado) {
      await confirmarSaidaEstoque(tenantId, item.pecaId, item.quantidade, osId, osNumero, userId);
      await db.update(osItens).set({ estoqueReservado: false }).where(eq(osItens.id, item.id));
    }
  }
}
