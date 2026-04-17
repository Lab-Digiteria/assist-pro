import { z } from "zod";
import { eq, and, like, or, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  suppliers,
  supplierBankAccounts,
  supplierDocuments,
} from "../../drizzle/schema";
import { storagePut } from "../storage";

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function resolveTenant(ctx: { tenantId: number | null; user: { id: number } }) {
  if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN", message: "Tenant não encontrado." });
  return ctx.tenantId;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
  return db;
}

function randomSuffix() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// ─── Input schemas ────────────────────────────────────────────────────────────
const supplierInput = z.object({
  companyType: z.enum(["juridica", "fisica"]).default("juridica"),
  corporateName: z.string().min(1, "Razão Social é obrigatória"),
  tradeName: z.string().optional(),
  cnpj: z.string().optional(),
  cpf: z.string().optional(),
  stateRegistration: z.string().optional(),
  municipalRegistration: z.string().optional(),
  cnae: z.string().optional(),
  foundingDate: z.string().optional(),
  isActive: z.boolean().default(true),
  isPreferred: z.boolean().default(false),
  // Contato
  emailPrimary: z.string().email().optional().or(z.literal("")),
  emailSecondary: z.string().email().optional().or(z.literal("")),
  phoneLandline: z.string().optional(),
  phoneMobile: z.string().optional(),
  phoneWhatsapp: z.string().optional(),
  website: z.string().optional(),
  contactName: z.string().optional(),
  contactRole: z.string().optional(),
  // Endereço
  zipCode: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().max(2).optional(),
  country: z.string().optional(),
  // Comercial
  supplierCategory: z.array(z.string()).optional(),
  paymentTerms: z.string().optional(),
  paymentMethodPreferred: z.enum(["pix", "boleto", "transferencia", "cartao"]).optional(),
  minimumOrder: z.number().optional(),
  averageDeliveryDays: z.number().int().optional(),
  discountPercentage: z.number().optional(),
  creditLimit: z.number().optional(),
  observationsCommercial: z.string().optional(),
  // Produtos
  brandsSupplied: z.array(z.string()).optional(),
  productLines: z.array(z.string()).optional(),
  catalogUrl: z.string().optional(),
  // Histórico
  firstPurchaseDate: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  ratingNotes: z.string().optional(),
});

const bankAccountInput = z.object({
  bankName: z.string().optional(),
  bankCode: z.string().optional(),
  agency: z.string().optional(),
  accountNumber: z.string().optional(),
  accountType: z.enum(["corrente", "poupanca", "pagamento"]).optional(),
  pixKey: z.string().optional(),
  pixKeyType: z.enum(["cpf", "cnpj", "email", "telefone", "aleatoria"]).optional(),
  accountHolder: z.string().optional(),
  isDefault: z.boolean().default(false),
});

// ─── Router ───────────────────────────────────────────────────────────────────
export const suppliersRouter = router({
  // LIST
  list: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      isActive: z.boolean().optional(),
      isPreferred: z.boolean().optional(),
      category: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const tenantId = await resolveTenant(ctx);
      const db = await requireDb();
      const rows = await db.select().from(suppliers)
        .where(
          and(
            eq(suppliers.tenantId, tenantId),
            input?.isActive !== undefined ? eq(suppliers.isActive, input.isActive) : undefined,
            input?.isPreferred ? eq(suppliers.isPreferred, true) : undefined,
            input?.search
              ? or(
                  like(suppliers.corporateName, `%${input.search}%`),
                  like(suppliers.tradeName, `%${input.search}%`),
                  like(suppliers.cnpj, `%${input.search}%`),
                  like(suppliers.emailPrimary, `%${input.search}%`),
                  like(suppliers.contactName, `%${input.search}%`),
                )
              : undefined,
          )
        )
        .orderBy(desc(suppliers.isPreferred), desc(suppliers.createdAt));
      return rows;
    }),

  // GET BY ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantId = await resolveTenant(ctx);
      const db = await requireDb();
      const [supplier] = await db.select().from(suppliers)
        .where(and(eq(suppliers.id, input.id), eq(suppliers.tenantId, tenantId)));
      if (!supplier) throw new TRPCError({ code: "NOT_FOUND", message: "Fornecedor não encontrado." });
      const bankAccounts = await db.select().from(supplierBankAccounts)
        .where(and(eq(supplierBankAccounts.supplierId, input.id), eq(supplierBankAccounts.tenantId, tenantId)));
      const documents = await db.select().from(supplierDocuments)
        .where(and(eq(supplierDocuments.supplierId, input.id), eq(supplierDocuments.tenantId, tenantId)));
      return { ...supplier, bankAccounts, documents };
    }),

  // CREATE
  create: protectedProcedure
    .input(supplierInput)
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenant(ctx);
      const db = await requireDb();
      const [result] = await db.insert(suppliers).values({
        tenantId,
        ...input,
        supplierCategory: input.supplierCategory ?? null,
        brandsSupplied: input.brandsSupplied ?? null,
        productLines: input.productLines ?? null,
        minimumOrder: input.minimumOrder?.toString(),
        discountPercentage: input.discountPercentage?.toString(),
        creditLimit: input.creditLimit?.toString(),
        emailPrimary: input.emailPrimary || null,
        emailSecondary: input.emailSecondary || null,
      });
      return { id: (result as any).insertId };
    }),

  // UPDATE
  update: protectedProcedure
    .input(z.object({ id: z.number() }).merge(supplierInput.partial()))
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenant(ctx);
      const db = await requireDb();
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = { ...data };
      if (data.minimumOrder !== undefined) updateData.minimumOrder = data.minimumOrder?.toString();
      if (data.discountPercentage !== undefined) updateData.discountPercentage = data.discountPercentage?.toString();
      if (data.creditLimit !== undefined) updateData.creditLimit = data.creditLimit?.toString();
      if (data.emailPrimary === "") updateData.emailPrimary = null;
      if (data.emailSecondary === "") updateData.emailSecondary = null;
      await db.update(suppliers)
        .set(updateData as any)
        .where(and(eq(suppliers.id, id), eq(suppliers.tenantId, tenantId)));
      return { success: true };
    }),

  // DELETE
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenant(ctx);
      const db = await requireDb();
      await db.delete(supplierDocuments).where(and(eq(supplierDocuments.supplierId, input.id), eq(supplierDocuments.tenantId, tenantId)));
      await db.delete(supplierBankAccounts).where(and(eq(supplierBankAccounts.supplierId, input.id), eq(supplierBankAccounts.tenantId, tenantId)));
      await db.delete(suppliers).where(and(eq(suppliers.id, input.id), eq(suppliers.tenantId, tenantId)));
      return { success: true };
    }),

  // TOGGLE ACTIVE
  toggleActive: protectedProcedure
    .input(z.object({ id: z.number(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenant(ctx);
      const db = await requireDb();
      await db.update(suppliers)
        .set({ isActive: input.isActive })
        .where(and(eq(suppliers.id, input.id), eq(suppliers.tenantId, tenantId)));
      return { success: true };
    }),

  // TOGGLE PREFERRED
  togglePreferred: protectedProcedure
    .input(z.object({ id: z.number(), isPreferred: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenant(ctx);
      const db = await requireDb();
      await db.update(suppliers)
        .set({ isPreferred: input.isPreferred })
        .where(and(eq(suppliers.id, input.id), eq(suppliers.tenantId, tenantId)));
      return { success: true };
    }),

  // ── BANK ACCOUNTS ──────────────────────────────────────────────────────────
  addBankAccount: protectedProcedure
    .input(z.object({ supplierId: z.number() }).merge(bankAccountInput))
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenant(ctx);
      const db = await requireDb();
      const { supplierId, ...data } = input;
      if (data.isDefault) {
        await db.update(supplierBankAccounts)
          .set({ isDefault: false })
          .where(and(eq(supplierBankAccounts.supplierId, supplierId), eq(supplierBankAccounts.tenantId, tenantId)));
      }
      const [result] = await db.insert(supplierBankAccounts).values({ supplierId, tenantId, ...data });
      return { id: (result as any).insertId };
    }),

  updateBankAccount: protectedProcedure
    .input(z.object({ id: z.number(), supplierId: z.number() }).merge(bankAccountInput.partial()))
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenant(ctx);
      const db = await requireDb();
      const { id, supplierId, ...data } = input;
      if (data.isDefault) {
        await db.update(supplierBankAccounts)
          .set({ isDefault: false })
          .where(and(eq(supplierBankAccounts.supplierId, supplierId), eq(supplierBankAccounts.tenantId, tenantId)));
      }
      await db.update(supplierBankAccounts)
        .set(data as any)
        .where(and(eq(supplierBankAccounts.id, id), eq(supplierBankAccounts.tenantId, tenantId)));
      return { success: true };
    }),

  deleteBankAccount: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenant(ctx);
      const db = await requireDb();
      await db.delete(supplierBankAccounts)
        .where(and(eq(supplierBankAccounts.id, input.id), eq(supplierBankAccounts.tenantId, tenantId)));
      return { success: true };
    }),

  // ── DOCUMENTS ──────────────────────────────────────────────────────────────
  getUploadUrl: protectedProcedure
    .input(z.object({
      supplierId: z.number(),
      fileName: z.string(),
      mimeType: z.string(),
      fileSize: z.number(),
      name: z.string(),
      documentType: z.enum(["contrato", "tabela_precos", "certificado", "outros"]).default("outros"),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenant(ctx);
      // Return a signed upload token — actual upload happens via uploadDocument
      return { ready: true, supplierId: input.supplierId };
    }),

  uploadDocument: protectedProcedure
    .input(z.object({
      supplierId: z.number(),
      name: z.string(),
      documentType: z.enum(["contrato", "tabela_precos", "certificado", "outros"]).default("outros"),
      fileBase64: z.string(),
      mimeType: z.string(),
      fileName: z.string(),
      fileSizeBytes: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenant(ctx);
      const db = await requireDb();
      const fileBuffer = Buffer.from(input.fileBase64, "base64");
      const fileKey = `tenant-${tenantId}/suppliers/${input.supplierId}/docs/${randomSuffix()}-${input.fileName}`;
      const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);
      const [result] = await db.insert(supplierDocuments).values({
        supplierId: input.supplierId,
        tenantId,
        name: input.name,
        documentType: input.documentType,
        fileUrl: url,
        fileKey,
        mimeType: input.mimeType,
        fileSizeBytes: input.fileSizeBytes,
      });
      return { id: (result as any).insertId, url };
    }),

  deleteDocument: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenant(ctx);
      const db = await requireDb();
      await db.delete(supplierDocuments)
        .where(and(eq(supplierDocuments.id, input.id), eq(supplierDocuments.tenantId, tenantId)));
      return { success: true };
    }),
});
