import {
  boolean,
  decimal,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── USERS ───────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── TENANTS ─────────────────────────────────────────────────────────────────
export const tenants = mysqlTable("tenants", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  ownerUserId: int("ownerUserId").notNull(),
  // Billing
  stripeCustomerId: varchar("stripeCustomerId", { length: 100 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 100 }),
  stripePriceId: varchar("stripePriceId", { length: 100 }),
  planType: mysqlEnum("planType", ["monthly", "annual", "lifetime"]).default("monthly"),
  subscriptionStatus: mysqlEnum("subscriptionStatus", [
    "trial",
    "active",
    "past_due",
    "suspended",
    "canceled",
    "expired",
  ])
    .default("trial")
    .notNull(),
  trialEndsAt: timestamp("trialEndsAt"),
  subscriptionEndsAt: timestamp("subscriptionEndsAt"),
  // Contact
  cpfCnpj: varchar("cpfCnpj", { length: 18 }),
  whatsapp: varchar("whatsapp", { length: 20 }),
  email: varchar("email", { length: 320 }),
  // OS counter
  osCounter: int("osCounter").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Tenant = typeof tenants.$inferSelect;

// ─── TENANT MEMBERS ──────────────────────────────────────────────────────────
export const tenantMembers = mysqlTable("tenantMembers", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["manager", "technician", "viewer"]).default("viewer").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TenantMember = typeof tenantMembers.$inferSelect;

// ─── LEADS ───────────────────────────────────────────────────────────────────
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  whatsapp: varchar("whatsapp", { length: 20 }),
  cpfCnpj: varchar("cpfCnpj", { length: 18 }),
  source: varchar("source", { length: 100 }),
  status: mysqlEnum("status", [
    "new",
    "contacted",
    "trial",
    "converted",
    "churned",
    "lost",
  ])
    .default("new")
    .notNull(),
  tenantId: int("tenantId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;

// ─── EMAIL CAMPAIGNS ─────────────────────────────────────────────────────────
export const emailCampaigns = mysqlTable("emailCampaigns", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  status: mysqlEnum("status", ["draft", "scheduled", "sent"]).default("draft").notNull(),
  targetSegment: mysqlEnum("targetSegment", ["all", "trial", "churned", "converted"]).default("all"),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailCampaign = typeof emailCampaigns.$inferSelect;

// ─── CLIENTES ────────────────────────────────────────────────────────────────
export const clientes = mysqlTable("clientes", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  tipo: mysqlEnum("tipo", ["pf", "pj"]).default("pf").notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  cpfCnpj: varchar("cpfCnpj", { length: 18 }),
  inscricaoEstadual: varchar("inscricaoEstadual", { length: 30 }),
  whatsapp: varchar("whatsapp", { length: 20 }),
  email: varchar("email", { length: 320 }),
  cep: varchar("cep", { length: 10 }),
  logradouro: varchar("logradouro", { length: 255 }),
  numero: varchar("numero", { length: 20 }),
  complemento: varchar("complemento", { length: 100 }),
  bairro: varchar("bairro", { length: 100 }),
  cidade: varchar("cidade", { length: 100 }),
  estado: varchar("estado", { length: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Cliente = typeof clientes.$inferSelect;

// ─── EQUIPAMENTOS ────────────────────────────────────────────────────────────
export const equipamentos = mysqlTable("equipamentos", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  clienteId: int("clienteId").notNull(),
  categoria: mysqlEnum("categoria", [
    "smartphone",
    "tablet",
    "notebook",
    "desktop",
    "smartwatch",
    "console",
    "tv",
    "outro",
  ]).notNull(),
  marca: varchar("marca", { length: 100 }).notNull(),
  modelo: varchar("modelo", { length: 100 }).notNull(),
  numeroSerie: varchar("numeroSerie", { length: 100 }),
  imei: varchar("imei", { length: 15 }),
  capacidade: varchar("capacidade", { length: 50 }),
  cor: varchar("cor", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Equipamento = typeof equipamentos.$inferSelect;

// ─── ORDENS DE SERVIÇO ───────────────────────────────────────────────────────
export const ordensServico = mysqlTable("ordensServico", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  numero: varchar("numero", { length: 20 }).notNull(), // OS-YYYY-NNNN
  clienteId: int("clienteId").notNull(),
  equipamentoId: int("equipamentoId").notNull(),
  tecnicoId: int("tecnicoId"),
  status: mysqlEnum("status", [
    "recebido",
    "em_diagnostico",
    "aguardando_aprovacao",
    "em_reparo",
    "concluido",
    "pronto_aguardando_retirada",
    "encerrado",
    "cancelado",
    "devolvido_sem_reparo",
  ])
    .default("recebido")
    .notNull(),
  prazoOrcamento: timestamp("prazoOrcamento"),
  dataNotificacaoCliente: timestamp("dataNotificacaoCliente"),
  tipoEncerramento: mysqlEnum("tipoEncerramento", [
    "com_pagamento_total",
    "com_saldo_devedor",
    "sem_reparo",
    "devolucao",
  ]),
  temGarantia: boolean("temGarantia").default(false),
  garantiaDias: int("garantiaDias").default(90),
  dataEncerramento: timestamp("dataEncerramento"),
  dataFimGarantia: timestamp("dataFimGarantia"),
  comissaoCalculada: decimal("comissaoCalculada", { precision: 10, scale: 2 }),
  valorTotal: decimal("valorTotal", { precision: 10, scale: 2 }).default("0"),
  valorPago: decimal("valorPago", { precision: 10, scale: 2 }).default("0"),
  // Checklist JSON
  checklistEstadoFisico: json("checklistEstadoFisico"),
  checklistSintomas: json("checklistSintomas"),
  senhaDesbloqueio: varchar("senhaDesbloqueio", { length: 100 }),
  acessoriosEntregues: json("acessoriosEntregues"),
  // Observações
  descricaoProblema: text("descricaoProblema"),
  observacoesInternas: text("observacoesInternas"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OrdemServico = typeof ordensServico.$inferSelect;

// ─── HISTÓRICO DE STATUS DA OS ───────────────────────────────────────────────
export const osStatusHistory = mysqlTable("osStatusHistory", {
  id: int("id").autoincrement().primaryKey(),
  osId: int("osId").notNull(),
  tenantId: int("tenantId").notNull(),
  statusAnterior: varchar("statusAnterior", { length: 50 }),
  statusNovo: varchar("statusNovo", { length: 50 }).notNull(),
  userId: int("userId"),
  observacao: text("observacao"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── ITENS DA OS (serviços e peças) ──────────────────────────────────────────
export const osItens = mysqlTable("osItens", {
  id: int("id").autoincrement().primaryKey(),
  osId: int("osId").notNull(),
  tenantId: int("tenantId").notNull(),
  tipo: mysqlEnum("tipo", ["servico", "peca"]).notNull(),
  descricao: varchar("descricao", { length: 255 }).notNull(),
  pecaId: int("pecaId"),
  quantidade: int("quantidade").default(1).notNull(),
  valorUnitario: decimal("valorUnitario", { precision: 10, scale: 2 }).notNull(),
  valorTotal: decimal("valorTotal", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OsItem = typeof osItens.$inferSelect;

// ─── LANÇAMENTOS FINANCEIROS DA OS ───────────────────────────────────────────
export const osLancamentos = mysqlTable("osLancamentos", {
  id: int("id").autoincrement().primaryKey(),
  osId: int("osId").notNull(),
  tenantId: int("tenantId").notNull(),
  tipo: mysqlEnum("tipo", ["sinal", "antecipacao", "pagamento_final", "estorno"]).notNull(),
  formaPagamento: mysqlEnum("formaPagamento", [
    "dinheiro",
    "pix",
    "cartao_debito",
    "cartao_credito",
    "faturamento_direto",
  ]).notNull(),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  observacao: text("observacao"),
  userId: int("userId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OsLancamento = typeof osLancamentos.$inferSelect;

// ─── CAIXA ───────────────────────────────────────────────────────────────────
export const caixaLancamentos = mysqlTable("caixaLancamentos", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  tipo: mysqlEnum("tipo", ["entrada", "saida"]).notNull(),
  descricao: varchar("descricao", { length: 255 }).notNull(),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  formaPagamento: mysqlEnum("formaPagamento", [
    "dinheiro",
    "pix",
    "cartao_debito",
    "cartao_credito",
    "faturamento_direto",
  ]),
  osId: int("osId"),
  osLancamentoId: int("osLancamentoId"),
  userId: int("userId"),
  manual: boolean("manual").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CaixaLancamento = typeof caixaLancamentos.$inferSelect;

// ─── ESTOQUE DE PEÇAS ────────────────────────────────────────────────────────
export const pecas = mysqlTable("pecas", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  codigo: varchar("codigo", { length: 20 }).notNull().unique(), // PÇ-NNNNNN
  nome: varchar("nome", { length: 255 }).notNull(),
  categoria: mysqlEnum("categoria", [
    "tela",
    "bateria",
    "conector",
    "cabo",
    "placa",
    "chip",
    "acessorio",
    "outro",
  ]).notNull(),
  precoCusto: decimal("precoCusto", { precision: 10, scale: 2 }),
  precoVenda: decimal("precoVenda", { precision: 10, scale: 2 }).notNull(),
  quantidadeAtual: int("quantidadeAtual").default(0).notNull(),
  quantidadeMinima: int("quantidadeMinima").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Peca = typeof pecas.$inferSelect;

// ─── MOVIMENTAÇÕES DE ESTOQUE ────────────────────────────────────────────────
export const estoqueMovimentacoes = mysqlTable("estoqueMovimentacoes", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  pecaId: int("pecaId").notNull(),
  tipo: mysqlEnum("tipo", ["entrada", "saida", "ajuste", "devolucao"]).notNull(),
  quantidade: int("quantidade").notNull(),
  quantidadeAnterior: int("quantidadeAnterior").notNull(),
  quantidadeNova: int("quantidadeNova").notNull(),
  osId: int("osId"),
  observacao: text("observacao"),
  userId: int("userId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── COMISSÕES DE TÉCNICOS ───────────────────────────────────────────────────
export const comissoesTecnicos = mysqlTable("comissoesTecnicos", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  tecnicoId: int("tecnicoId").notNull(),
  categoria: mysqlEnum("categoria", [
    "smartphone",
    "tablet",
    "notebook",
    "desktop",
    "smartwatch",
    "console",
    "tv",
    "outro",
  ]).notNull(),
  percentual: decimal("percentual", { precision: 5, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ComissaoTecnico = typeof comissoesTecnicos.$inferSelect;

// ─── STRIPE EVENTS (idempotência de webhooks) ────────────────────────────────
export const stripeEvents = mysqlTable("stripeEvents", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("eventId", { length: 100 }).notNull().unique(),
  eventType: varchar("eventType", { length: 100 }).notNull(),
  processedAt: timestamp("processedAt").defaultNow().notNull(),
});
