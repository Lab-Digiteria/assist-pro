import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { employees } from "../../drizzle/schema";
import { eq, and, like, or } from "drizzle-orm";
import { storagePut } from "../storage";

async function resolveTenant(ctx: { tenantId: number | null; user: { id: number } }) {
  if (!ctx.tenantId) throw new TRPCError({ code: "FORBIDDEN", message: "Tenant não encontrado." });
  return ctx.tenantId;
}

const employeeInput = z.object({
  fullName: z.string().min(2),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  birthDate: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  role: z.enum(["technician", "attendant", "manager", "admin"]).default("technician"),
  specialties: z.array(z.string()).optional(),
  hireDate: z.string().optional(),
  isActive: z.boolean().default(true),
  userAccountId: z.number().optional(),
  commissionType: z.enum(["none", "percentage", "fixed"]).default("none"),
  commissionPercentage: z.string().optional(),
  commissionFixedValue: z.string().optional(),
  commissionBase: z.enum(["services_only", "services_and_parts", "total"]).default("services_only"),
});

export const employeesRouter = router({
  list: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      role: z.string().optional(),
      isActive: z.boolean().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const tenantId = await resolveTenant(ctx);
      const db = await getDb();
      if (!db) return [];
      let rows = await db
        .select()
        .from(employees)
        .where(eq(employees.tenantId, tenantId));
      if (input?.isActive !== undefined) rows = rows.filter(r => r.isActive === input.isActive);
      if (input?.role) rows = rows.filter(r => r.role === input.role);
      if (input?.search) {
        const q = input.search.toLowerCase();
        rows = rows.filter(r =>
          r.fullName.toLowerCase().includes(q) ||
          (r.email ?? "").toLowerCase().includes(q) ||
          (r.phone ?? "").includes(q)
        );
      }
      return rows;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantId = await resolveTenant(ctx);
      const db = await getDb();
      if (!db) return null;
      const rows = await db.select().from(employees)
        .where(and(eq(employees.id, input.id), eq(employees.tenantId, tenantId)))
        .limit(1);
      return rows[0] ?? null;
    }),

  create: protectedProcedure
    .input(employeeInput)
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenant(ctx);
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const result = await db.insert(employees).values({
        tenantId,
        fullName: input.fullName,
        cpf: input.cpf,
        rg: input.rg,
        birthDate: input.birthDate,
        phone: input.phone,
        email: input.email,
        address: input.address,
        role: input.role,
        specialties: input.specialties ?? null,
        hireDate: input.hireDate,
        isActive: input.isActive,
        userAccountId: input.userAccountId,
        commissionType: input.commissionType,
        commissionPercentage: input.commissionPercentage ?? null,
        commissionFixedValue: input.commissionFixedValue ?? null,
        commissionBase: input.commissionBase,
      });
      const id = (result as any).insertId as number;
      const rows = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
      return rows[0];
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number() }).merge(employeeInput.partial()))
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenant(ctx);
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, specialties, ...rest } = input;
      await db.update(employees).set({
        ...rest,
        ...(specialties !== undefined ? { specialties } : {}),
      }).where(and(eq(employees.id, id), eq(employees.tenantId, tenantId)));
      const rows = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
      return rows[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenant(ctx);
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(employees).where(and(eq(employees.id, input.id), eq(employees.tenantId, tenantId)));
      return { success: true };
    }),

  toggleActive: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenant(ctx);
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const rows = await db.select().from(employees)
        .where(and(eq(employees.id, input.id), eq(employees.tenantId, tenantId))).limit(1);
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND" });
      await db.update(employees).set({ isActive: !rows[0].isActive })
        .where(eq(employees.id, input.id));
      return { isActive: !rows[0].isActive };
    }),

  uploadPhoto: protectedProcedure
    .input(z.object({
      id: z.number(),
      base64: z.string(),
      mimeType: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = await resolveTenant(ctx);
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const buffer = Buffer.from(input.base64, "base64");
      const ext = input.mimeType.includes("png") ? "png" : "jpg";
      const key = `tenants/${tenantId}/employees/${input.id}-photo-${Date.now()}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      await db.update(employees).set({ photoUrl: url, photoKey: key })
        .where(and(eq(employees.id, input.id), eq(employees.tenantId, tenantId)));
      return { photoUrl: url };
    }),
});
