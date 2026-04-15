import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  caixaLancamentos,
  clientes,
  comissoesTecnicos,
  emailCampaigns,
  equipamentos,
  estoqueMovimentacoes,
  InsertUser,
  leads,
  ordensServico,
  osItens,
  osLancamentos,
  osStatusHistory,
  pecas,
  tenantMembers,
  tenants,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { generateOsNumber, generatePartCode, generateSlug } from "../shared/utils";

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
    .select()
    .from(ordensServico)
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

  // Auto-fill dataNotificacaoCliente
  if (newStatus === "pronto_aguardando_retirada" && !os.dataNotificacaoCliente) {
    updates.dataNotificacaoCliente = new Date();
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
  return db
    .select()
    .from(osItens)
    .where(and(eq(osItens.osId, osId), eq(osItens.tenantId, tenantId)));
}

export async function addOsItem(
  tenantId: number,
  osId: number,
  data: { tipo: "servico" | "peca"; descricao: string; pecaId?: number; quantidade: number; valorUnitario: number }
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
    quantidade: data.quantidade,
    valorUnitario: String(data.valorUnitario),
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
