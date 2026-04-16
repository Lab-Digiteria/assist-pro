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
  // ── Campos inteligentes (Funcionalidade 1) ──
  origemCliente: mysqlEnum("origemCliente", [
    "indicacao",
    "google",
    "redes_sociais",
    "passante",
    "outro",
  ]),
  preferenciaContato: mysqlEnum("preferenciaContato", ["whatsapp", "email", "ligacao"]),
  horarioPreferidoContato: varchar("horarioPreferidoContato", { length: 50 }),
  classificacao: mysqlEnum("classificacao", ["padrao", "vip", "recorrente", "inadimplente"])
    .default("padrao")
    .notNull(),
  observacoesInternas: text("observacoesInternas"),
  aceitouTermos: boolean("aceitouTermos").default(false).notNull(),
  aceitouTermosAt: timestamp("aceitouTermosAt"),
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
  // ── Camada de segurança (Funcionalidade 2) ──
  laudoTecnico: text("laudoTecnico"),
  numeroLacre: varchar("numeroLacre", { length: 50 }),
  semSolucaoPossivel: boolean("semSolucaoPossivel").default(false),
  justificativaSemSolucao: text("justificativaSemSolucao"),
  assinaturaClienteUrl: varchar("assinaturaClienteUrl", { length: 500 }),
  // ── Orçamento (Funcionalidade 2 + 5) ──
  statusOrcamento: mysqlEnum("statusOrcamento", ["pendente", "aprovado", "reprovado"])
    .default("pendente"),
  motivoReprovacao: text("motivoReprovacao"),
  descontoValor: decimal("descontoValor", { precision: 10, scale: 2 }).default("0"),
  prazoEstimadoConclusao: timestamp("prazoEstimadoConclusao"),
  validadeOrcamento: timestamp("validadeOrcamento"),
  // ── Área do cliente (Funcionalidade 5) ──
  clientToken: varchar("clientToken", { length: 36 }),
  clientTokenExpiresAt: timestamp("clientTokenExpiresAt"),
  clientObservacoes: text("clientObservacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OrdemServico = typeof ordensServico.$inferSelect;

// ─── FOTOS DA OS (Funcionalidade 2) ──────────────────────────────────────────
export const osPhotos = mysqlTable("osPhotos", {
  id: int("id").autoincrement().primaryKey(),
  osId: int("osId").notNull(),
  tenantId: int("tenantId").notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  tipo: mysqlEnum("tipo", ["entrada", "saida", "laudo"]).default("entrada").notNull(),
  uploadedBy: int("uploadedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OsPhoto = typeof osPhotos.$inferSelect;

// ─── AUDITORIA DE CAMPOS DA OS (Funcionalidade 2) ────────────────────────────
export const osFieldAudit = mysqlTable("osFieldAudit", {
  id: int("id").autoincrement().primaryKey(),
  osId: int("osId").notNull(),
  tenantId: int("tenantId").notNull(),
  campo: varchar("campo", { length: 100 }).notNull(),
  valorAnterior: text("valorAnterior"),
  valorNovo: text("valorNovo"),
  userId: int("userId"),
  userName: varchar("userName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OsFieldAuditEntry = typeof osFieldAudit.$inferSelect;

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
  descricaoTecnica: text("descricaoTecnica"),
  pecaId: int("pecaId"),
  quantidade: int("quantidade").default(1).notNull(),
  valorUnitario: decimal("valorUnitario", { precision: 10, scale: 2 }).notNull(),
  valorCusto: decimal("valorCusto", { precision: 10, scale: 2 }),
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

// ─── PLANS ───────────────────────────────────────────────────────────────────
export const plans = mysqlTable("plans", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  priceMonthly: int("priceMonthly").notNull(),
  trialDays: int("trialDays").default(14).notNull(),
  stripePriceId: varchar("stripePriceId", { length: 100 }),
  isLifetime: boolean("isLifetime").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Plan = typeof plans.$inferSelect;

// ─── SUBSCRIPTIONS ───────────────────────────────────────────────────────────
export const SUBSCRIPTION_STATUSES = [
  "trialing",
  "active",
  "past_due",
  "suspended",
  "canceled",
  "expired",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const subscriptions = mysqlTable("subscriptions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  tenantId: int("tenantId").notNull().unique(),
  planId: varchar("planId", { length: 36 }).notNull(),
  status: mysqlEnum("status", SUBSCRIPTION_STATUSES).notNull().default("trialing"),
  trialEndsAt: timestamp("trialEndsAt"),
  currentPeriodStartsAt: timestamp("currentPeriodStartsAt"),
  currentPeriodEndsAt: timestamp("currentPeriodEndsAt"),
  canceledAt: timestamp("canceledAt"),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Subscription = typeof subscriptions.$inferSelect;

// ─── BILLING EVENTS ──────────────────────────────────────────────────────────
export const billingEvents = mysqlTable("billingEvents", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("eventId", { length: 36 }).notNull().unique(),
  eventType: varchar("eventType", { length: 100 }).notNull(),
  tenantId: int("tenantId").notNull(),
  payload: json("payload"),
  idempotencyKey: varchar("idempotencyKey", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── USER PASSWORDS (auth próprio) ───────────────────────────────────────────
export const userPasswords = mysqlTable("userPasswords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── AUDIT LOGS ──────────────────────────────────────────────────────────────
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  actorId: int("actorId"),
  actorName: varchar("actorName", { length: 255 }),
  tenantId: int("tenantId"),
  action: varchar("action", { length: 100 }).notNull(),
  resource: varchar("resource", { length: 64 }),
  resourceId: varchar("resourceId", { length: 64 }),
  metadata: json("metadata"),
  ipAddress: varchar("ipAddress", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ─── REVENDEDORES ─────────────────────────────────────────────────────────────
export const revendedores = mysqlTable("revendedores", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 20 }).notNull(),
  cidade: varchar("cidade", { length: 100 }).notNull(),
  estado: varchar("estado", { length: 2 }).notNull(),
  atuacao: mysqlEnum("atuacao", [
    "consultor_ti",
    "revendedor_software",
    "assistencia_tecnica",
    "agencia_marketing",
    "outro",
  ]).notNull(),
  mensagem: text("mensagem"),
  status: mysqlEnum("status", ["pendente", "ativo", "inativo"]).default("pendente").notNull(),
  referralCode: varchar("referralCode", { length: 12 }).unique(),
  referralPassword: varchar("referralPassword", { length: 255 }),
  commissionRate: decimal("commissionRate", { precision: 5, scale: 2 }).default("20.00").notNull(),
  totalClicks: int("totalClicks").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Revendedor = typeof revendedores.$inferSelect;
export type InsertRevendedor = typeof revendedores.$inferInsert;

// ─── REFERRAL CONVERSIONS ──────────────────────────────────────────────────────────────────
export const referralConversions = mysqlTable("referralConversions", {
  id: int("id").autoincrement().primaryKey(),
  revendedorId: int("revendedorId").notNull(),
  tenantId: int("tenantId").notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "cancelled"]).default("pending").notNull(),
  planName: varchar("planName", { length: 100 }),
  planValue: decimal("planValue", { precision: 10, scale: 2 }),
  commissionRate: decimal("commissionRate", { precision: 5, scale: 2 }).default("20.00").notNull(),
  commissionValue: decimal("commissionValue", { precision: 10, scale: 2 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  confirmedAt: timestamp("confirmedAt"),
});
export type ReferralConversion = typeof referralConversions.$inferSelect;
export type InsertReferralConversion = typeof referralConversions.$inferInsert;

// ─── REVENDEDOR COMMISSIONS ─────────────────────────────────────────────────────────────────
export const revendedorCommissions = mysqlTable("revendedorCommissions", {
  id: int("id").autoincrement().primaryKey(),
  revendedorId: int("revendedorId").notNull(),
  periodoMes: int("periodoMes").notNull(),
  periodoAno: int("periodoAno").notNull(),
  totalConversions: int("totalConversions").default(0).notNull(),
  totalValue: decimal("totalValue", { precision: 10, scale: 2 }).default("0.00").notNull(),
  status: mysqlEnum("status", ["pending", "paid"]).default("pending").notNull(),
  paidAt: timestamp("paidAt"),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RevendedorCommission = typeof revendedorCommissions.$inferSelect;
export type InsertRevendedorCommission = typeof revendedorCommissions.$inferInsert;
