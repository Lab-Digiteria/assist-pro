import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { companySettings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { storagePut } from "../storage";

async function resolveTenant(ctx: { tenantId: number | null; user: { id: number } }) {
  if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN", message: "Tenant não encontrado." });
  return ctx.tenantId;
}

async function getOrCreateSettings(tenantId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(companySettings).where(eq(companySettings.tenantId, tenantId)).limit(1);
  if (rows.length > 0) return rows[0];
  // Create default
  await db.insert(companySettings).values({ tenantId, primaryColor: "#1B4F8A", secondaryColor: "#C4733A" });
  const created = await db.select().from(companySettings).where(eq(companySettings.tenantId, tenantId)).limit(1);
  return created[0] ?? null;
}

export const companySettingsRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = await resolveTenant(ctx);
    return getOrCreateSettings(tenantId);
  }),

  update: protectedProcedure
    .input(z.object({
      companyName: z.string().optional(),
      tradeName: z.string().optional(),
      cnpj: z.string().optional(),
      stateRegistration: z.string().optional(),
      municipalRegistration: z.string().optional(),
      phonePrimary: z.string().optional(),
      phoneSecondary: z.string().optional(),
      whatsapp: z.string().optional(),
      emailPrimary: z.string().optional(),
      emailSecondary: z.string().optional(),
      website: z.string().optional(),
      zipCode: z.string().optional(),
      street: z.string().optional(),
      number: z.string().optional(),
      complement: z.string().optional(),
      neighborhood: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      documentHeaderText: z.string().optional(),
      documentFooterText: z.string().optional(),
      warrantyText: z.string().optional(),
      osTerms: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenant(ctx);
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await getOrCreateSettings(tenantId);
      await db.update(companySettings).set({ ...input }).where(eq(companySettings.tenantId, tenantId));
      return getOrCreateSettings(tenantId);
    }),

  uploadLogo: protectedProcedure
    .input(z.object({
      base64: z.string(),
      mimeType: z.string(),
      fileName: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenant(ctx);
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const buffer = Buffer.from(input.base64, "base64");
      const ext = input.mimeType.includes("png") ? "png" : "jpg";
      const key = `tenants/${tenantId}/logo-${Date.now()}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      await getOrCreateSettings(tenantId);
      await db.update(companySettings).set({ logoUrl: url, logoKey: key }).where(eq(companySettings.tenantId, tenantId));
      return { logoUrl: url };
    }),
});
