import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { CHART_OF_ACCOUNTS_SEED } from "../financeiro-seed";
import {
  bankAccounts,
  chartOfAccounts,
  payables,
  receivables,
} from "../../drizzle/schema";
import { getTenantByMember, getTenantByOwner } from "../db";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function resolveTenant(userId: number): Promise<number> {
  const owned = await getTenantByOwner(userId);
  if (owned) return owned.id;
  const member = await getTenantByMember(userId);
  if (member) return member.id;
  throw new TRPCError({ code: "FORBIDDEN" });
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addMonths(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + n);
  return toDateStr(d);
}

const PAYMENT_METHODS = ["dinheiro", "pix", "debito", "credito", "boleto", "outros"] as const;

// ─── Seed do Plano de Contas ──────────────────────────────────────────────────

export async function seedChartOfAccounts(tenantId: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await db
    .select({ id: chartOfAccounts.id })
    .from(chartOfAccounts)
    .where(eq(chartOfAccounts.tenantId, tenantId))
    .limit(1);
  if (existing.length > 0) return;

  const codeToId: Record<string, number> = {};
  for (const item of CHART_OF_ACCOUNTS_SEED) {
    const parentId = item.parentCode ? codeToId[item.parentCode] : null;
    const [result] = await db.insert(chartOfAccounts).values({
      tenantId,
      code: item.code,
      name: item.name,
      type: item.type,
      parentId: parentId ?? undefined,
      isSystem: true,
      isActive: true,
    });
    codeToId[item.code] = (result as any).insertId;
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const financeiroV2Router = router({

  // ── Plano de Contas ────────────────────────────────────────────────────────
  chartOfAccounts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const tenantId = await resolveTenant(ctx.user.id);
      const db = await getDb();
      if (!db) return [];
      await seedChartOfAccounts(tenantId);
      return db.select().from(chartOfAccounts)
        .where(eq(chartOfAccounts.tenantId, tenantId))
        .orderBy(asc(chartOfAccounts.code));
    }),

    create: protectedProcedure
      .input(z.object({
        code: z.string().min(1).max(20),
        name: z.string().min(1).max(200),
        type: z.enum(["receita", "custo", "despesa"]),
        parentId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const tenantId = await resolveTenant(ctx.user.id);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.insert(chartOfAccounts).values({ ...input, tenantId, isSystem: false });
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(200).optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const tenantId = await resolveTenant(ctx.user.id);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { id, ...data } = input;
        await db.update(chartOfAccounts)
          .set(data)
          .where(and(eq(chartOfAccounts.id, id), eq(chartOfAccounts.tenantId, tenantId)));
        return { success: true };
      }),
  }),

  // ── Contas Bancárias ───────────────────────────────────────────────────────
  bankAccounts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const tenantId = await resolveTenant(ctx.user.id);
      const db = await getDb();
      if (!db) return [];
      return db.select().from(bankAccounts)
        .where(eq(bankAccounts.tenantId, tenantId))
        .orderBy(asc(bankAccounts.name));
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(200),
        type: z.enum(["checking", "savings", "cash", "digital"]),
        bankName: z.string().optional(),
        agency: z.string().optional(),
        accountNumber: z.string().optional(),
        initialBalance: z.number().default(0),
      }))
      .mutation(async ({ ctx, input }) => {
        const tenantId = await resolveTenant(ctx.user.id);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.insert(bankAccounts).values({
          ...input,
          tenantId,
          initialBalance: String(input.initialBalance),
          currentBalance: String(input.initialBalance),
        });
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(200).optional(),
        bankName: z.string().nullable().optional(),
        agency: z.string().nullable().optional(),
        accountNumber: z.string().nullable().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const tenantId = await resolveTenant(ctx.user.id);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { id, ...data } = input;
        await db.update(bankAccounts)
          .set(data as any)
          .where(and(eq(bankAccounts.id, id), eq(bankAccounts.tenantId, tenantId)));
        return { success: true };
      }),

    transfer: protectedProcedure
      .input(z.object({
        fromAccountId: z.number(),
        toAccountId: z.number(),
        amount: z.number().positive(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const tenantId = await resolveTenant(ctx.user.id);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const today = toDateStr(new Date());
        const desc = input.description || "Transferência entre contas";

        await db.update(bankAccounts)
          .set({ currentBalance: sql`currentBalance - ${input.amount}` })
          .where(and(eq(bankAccounts.id, input.fromAccountId), eq(bankAccounts.tenantId, tenantId)));

        await db.update(bankAccounts)
          .set({ currentBalance: sql`currentBalance + ${input.amount}` })
          .where(and(eq(bankAccounts.id, input.toAccountId), eq(bankAccounts.tenantId, tenantId)));

        await db.insert(payables).values({
          tenantId,
          description: `${desc} (saída)`,
          amount: String(input.amount),
          dueDate: today,
          paidDate: today,
          status: "paid",
          bankAccountId: input.fromAccountId,
          isRecurring: false,
        });

        await db.insert(receivables).values({
          tenantId,
          description: `${desc} (entrada)`,
          amount: String(input.amount),
          dueDate: today,
          receivedDate: today,
          status: "received",
          bankAccountId: input.toAccountId,
        });

        return { success: true };
      }),
  }),

  // ── Contas a Receber ───────────────────────────────────────────────────────
  receivables: router({
    list: protectedProcedure
      .input(z.object({
        status: z.enum(["pending", "received", "overdue", "cancelled"]).optional(),
        from: z.string().optional(),
        to: z.string().optional(),
        chartOfAccountId: z.number().optional(),
        bankAccountId: z.number().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const tenantId = await resolveTenant(ctx.user.id);
        const db = await getDb();
        if (!db) return [];
        const conditions = [eq(receivables.tenantId, tenantId)];
        if (input?.status) conditions.push(eq(receivables.status, input.status));
        if (input?.from) conditions.push(gte(receivables.dueDate, input.from));
        if (input?.to) conditions.push(lte(receivables.dueDate, input.to));
        if (input?.chartOfAccountId) conditions.push(eq(receivables.chartOfAccountId, input.chartOfAccountId));
        if (input?.bankAccountId) conditions.push(eq(receivables.bankAccountId, input.bankAccountId));
        return db.select().from(receivables)
          .where(and(...conditions))
          .orderBy(asc(receivables.dueDate));
      }),

    create: protectedProcedure
      .input(z.object({
        description: z.string().min(1).max(500),
        amount: z.number().positive(),
        dueDate: z.string(),
        paymentMethod: z.enum(PAYMENT_METHODS).optional(),
        bankAccountId: z.number().optional(),
        chartOfAccountId: z.number().optional(),
        serviceOrderId: z.number().optional(),
        customerId: z.number().optional(),
        installments: z.number().min(1).max(24).default(1),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const tenantId = await resolveTenant(ctx.user.id);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const group = input.installments > 1 ? crypto.randomUUID() : undefined;
        const installmentAmount = input.amount / input.installments;
        for (let i = 0; i < input.installments; i++) {
          const dueDate = i === 0 ? input.dueDate : addMonths(input.dueDate, i);
          await db.insert(receivables).values({
            tenantId,
            description: input.installments > 1
              ? `${input.description} (${i + 1}/${input.installments})`
              : input.description,
            amount: String(installmentAmount.toFixed(2)),
            dueDate,
            paymentMethod: input.paymentMethod,
            bankAccountId: input.bankAccountId,
            chartOfAccountId: input.chartOfAccountId,
            serviceOrderId: input.serviceOrderId,
            customerId: input.customerId,
            installmentGroup: group,
            installmentNumber: i + 1,
            installmentTotal: input.installments,
            notes: input.notes,
          });
        }
        return { success: true };
      }),

    receive: protectedProcedure
      .input(z.object({
        id: z.number(),
        receivedDate: z.string(),
        paymentMethod: z.enum(PAYMENT_METHODS).optional(),
        bankAccountId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const tenantId = await resolveTenant(ctx.user.id);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const [rec] = await db.select().from(receivables)
          .where(and(eq(receivables.id, input.id), eq(receivables.tenantId, tenantId)))
          .limit(1);
        if (!rec) throw new TRPCError({ code: "NOT_FOUND" });
        await db.update(receivables)
          .set({
            status: "received",
            receivedDate: input.receivedDate,
            paymentMethod: input.paymentMethod ?? rec.paymentMethod ?? undefined,
            bankAccountId: input.bankAccountId ?? rec.bankAccountId ?? undefined,
          })
          .where(eq(receivables.id, input.id));
        if (input.bankAccountId || rec.bankAccountId) {
          const accId = input.bankAccountId ?? rec.bankAccountId!;
          await db.update(bankAccounts)
            .set({ currentBalance: sql`currentBalance + ${rec.amount}` })
            .where(and(eq(bankAccounts.id, accId), eq(bankAccounts.tenantId, tenantId)));
        }
        return { success: true };
      }),

    cancel: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const tenantId = await resolveTenant(ctx.user.id);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.update(receivables)
          .set({ status: "cancelled" })
          .where(and(eq(receivables.id, input.id), eq(receivables.tenantId, tenantId)));
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        description: z.string().min(1).max(500).optional(),
        amount: z.number().positive().optional(),
        dueDate: z.string().optional(),
        chartOfAccountId: z.number().nullable().optional(),
        bankAccountId: z.number().nullable().optional(),
        notes: z.string().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const tenantId = await resolveTenant(ctx.user.id);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { id, amount, ...rest } = input;
        await db.update(receivables)
          .set({ ...rest, ...(amount ? { amount: String(amount) } : {}) } as any)
          .where(and(eq(receivables.id, id), eq(receivables.tenantId, tenantId)));
        return { success: true };
      }),
  }),

  // ── Contas a Pagar ─────────────────────────────────────────────────────────
  payables: router({
    list: protectedProcedure
      .input(z.object({
        status: z.enum(["pending", "paid", "overdue", "cancelled"]).optional(),
        isRecurring: z.boolean().optional(),
        from: z.string().optional(),
        to: z.string().optional(),
        chartOfAccountId: z.number().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const tenantId = await resolveTenant(ctx.user.id);
        const db = await getDb();
        if (!db) return [];
        const conditions = [eq(payables.tenantId, tenantId)];
        if (input?.status) conditions.push(eq(payables.status, input.status));
        if (input?.isRecurring !== undefined) conditions.push(eq(payables.isRecurring, input.isRecurring));
        if (input?.from) conditions.push(gte(payables.dueDate, input.from));
        if (input?.to) conditions.push(lte(payables.dueDate, input.to));
        if (input?.chartOfAccountId) conditions.push(eq(payables.chartOfAccountId, input.chartOfAccountId));
        return db.select().from(payables)
          .where(and(...conditions))
          .orderBy(asc(payables.dueDate));
      }),

    create: protectedProcedure
      .input(z.object({
        description: z.string().min(1).max(500),
        amount: z.number().positive(),
        dueDate: z.string(),
        paymentMethod: z.enum(PAYMENT_METHODS).optional(),
        bankAccountId: z.number().optional(),
        chartOfAccountId: z.number().optional(),
        supplierName: z.string().optional(),
        documentNumber: z.string().optional(),
        isRecurring: z.boolean().default(false),
        recurrenceConfig: z.object({
          frequency: z.enum(["monthly", "weekly", "yearly"]),
          dayOfMonth: z.number().optional(),
          endDate: z.string().optional(),
        }).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const tenantId = await resolveTenant(ctx.user.id);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.insert(payables).values({
          ...input,
          tenantId,
          amount: String(input.amount),
          recurrenceConfig: input.recurrenceConfig ?? null,
        });
        return { success: true };
      }),

    pay: protectedProcedure
      .input(z.object({
        id: z.number(),
        paidDate: z.string(),
        paymentMethod: z.enum(PAYMENT_METHODS).optional(),
        bankAccountId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const tenantId = await resolveTenant(ctx.user.id);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const [pay] = await db.select().from(payables)
          .where(and(eq(payables.id, input.id), eq(payables.tenantId, tenantId)))
          .limit(1);
        if (!pay) throw new TRPCError({ code: "NOT_FOUND" });
        await db.update(payables)
          .set({
            status: "paid",
            paidDate: input.paidDate,
            paymentMethod: input.paymentMethod ?? pay.paymentMethod ?? undefined,
            bankAccountId: input.bankAccountId ?? pay.bankAccountId ?? undefined,
          })
          .where(eq(payables.id, input.id));
        if (input.bankAccountId || pay.bankAccountId) {
          const accId = input.bankAccountId ?? pay.bankAccountId!;
          await db.update(bankAccounts)
            .set({ currentBalance: sql`currentBalance - ${pay.amount}` })
            .where(and(eq(bankAccounts.id, accId), eq(bankAccounts.tenantId, tenantId)));
        }
        // Gerar próximo lançamento recorrente
        if (pay.isRecurring && pay.recurrenceConfig) {
          const cfg = pay.recurrenceConfig as { frequency: string; dayOfMonth?: number; endDate?: string };
          let nextDue = pay.dueDate;
          if (cfg.frequency === "monthly") nextDue = addMonths(pay.dueDate, 1);
          else if (cfg.frequency === "yearly") nextDue = addMonths(pay.dueDate, 12);
          else if (cfg.frequency === "weekly") {
            const d = new Date(pay.dueDate + "T00:00:00Z");
            d.setUTCDate(d.getUTCDate() + 7);
            nextDue = toDateStr(d);
          }
          if (!cfg.endDate || nextDue <= cfg.endDate) {
            await db.insert(payables).values({
              tenantId,
              description: pay.description,
              amount: pay.amount,
              dueDate: nextDue,
              bankAccountId: pay.bankAccountId ?? undefined,
              chartOfAccountId: pay.chartOfAccountId ?? undefined,
              supplierName: pay.supplierName ?? undefined,
              documentNumber: pay.documentNumber ?? undefined,
              isRecurring: true,
              recurrenceConfig: pay.recurrenceConfig,
              notes: pay.notes ?? undefined,
              parentPayableId: pay.id,
            });
          }
        }
        return { success: true };
      }),

    cancel: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const tenantId = await resolveTenant(ctx.user.id);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.update(payables)
          .set({ status: "cancelled" })
          .where(and(eq(payables.id, input.id), eq(payables.tenantId, tenantId)));
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        description: z.string().min(1).max(500).optional(),
        amount: z.number().positive().optional(),
        dueDate: z.string().optional(),
        chartOfAccountId: z.number().nullable().optional(),
        bankAccountId: z.number().nullable().optional(),
        supplierName: z.string().nullable().optional(),
        documentNumber: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
        isRecurring: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const tenantId = await resolveTenant(ctx.user.id);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { id, amount, ...rest } = input;
        await db.update(payables)
          .set({ ...rest, ...(amount ? { amount: String(amount) } : {}) } as any)
          .where(and(eq(payables.id, id), eq(payables.tenantId, tenantId)));
        return { success: true };
      }),
  }),

  // ── Fluxo de Caixa ─────────────────────────────────────────────────────────
  cashFlow: protectedProcedure
    .input(z.object({
      from: z.string(),
      to: z.string(),
      bankAccountId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const tenantId = await resolveTenant(ctx.user.id);
      const db = await getDb();
      if (!db) return { entries: [], totalIn: 0, totalOut: 0, balance: 0 };

      const recCond = [
        eq(receivables.tenantId, tenantId),
        gte(receivables.dueDate, input.from),
        lte(receivables.dueDate, input.to),
      ];
      if (input.bankAccountId) recCond.push(eq(receivables.bankAccountId, input.bankAccountId));

      const payCond = [
        eq(payables.tenantId, tenantId),
        gte(payables.dueDate, input.from),
        lte(payables.dueDate, input.to),
      ];
      if (input.bankAccountId) payCond.push(eq(payables.bankAccountId, input.bankAccountId));

      const [recs, pays] = await Promise.all([
        db.select().from(receivables).where(and(...recCond)).orderBy(asc(receivables.dueDate)),
        db.select().from(payables).where(and(...payCond)).orderBy(asc(payables.dueDate)),
      ]);

      type Entry = {
        date: string;
        description: string;
        type: "in" | "out";
        amount: number;
        status: string;
        isProjected: boolean;
      };

      const entries: Entry[] = [
        ...recs.map(r => ({
          date: r.receivedDate || r.dueDate,
          description: r.description,
          type: "in" as const,
          amount: parseFloat(r.amount),
          status: r.status,
          isProjected: r.status !== "received",
        })),
        ...pays.map(p => ({
          date: p.paidDate || p.dueDate,
          description: p.description,
          type: "out" as const,
          amount: parseFloat(p.amount),
          status: p.status,
          isProjected: p.status !== "paid",
        })),
      ].sort((a, b) => a.date.localeCompare(b.date));

      let running = 0;
      const withBalance = entries.map(e => {
        running += e.type === "in" ? e.amount : -e.amount;
        return { ...e, runningBalance: running };
      });

      const totalIn = entries.filter(e => e.type === "in").reduce((s, e) => s + e.amount, 0);
      const totalOut = entries.filter(e => e.type === "out").reduce((s, e) => s + e.amount, 0);

      return { entries: withBalance, totalIn, totalOut, balance: totalIn - totalOut };
    }),

  // ── DRE ────────────────────────────────────────────────────────────────────
  dre: protectedProcedure
    .input(z.object({
      from: z.string(),
      to: z.string(),
      compareFrom: z.string().optional(),
      compareTo: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const tenantId = await resolveTenant(ctx.user.id);
      const db = await getDb();
      if (!db) return null;

      async function calcPeriod(from: string, to: string) {
        const [recs, pays, accounts] = await Promise.all([
          db!.select().from(receivables)
            .where(and(
              eq(receivables.tenantId, tenantId),
              eq(receivables.status, "received"),
              gte(receivables.receivedDate, from),
              lte(receivables.receivedDate, to),
            )),
          db!.select().from(payables)
            .where(and(
              eq(payables.tenantId, tenantId),
              eq(payables.status, "paid"),
              gte(payables.paidDate, from),
              lte(payables.paidDate, to),
            )),
          db!.select().from(chartOfAccounts)
            .where(eq(chartOfAccounts.tenantId, tenantId)),
        ]);

        const accountMap = new Map(accounts.map(a => [a.id, a]));

        function sumPayByPrefix(prefix: string) {
          return pays.filter(p => {
            if (!p.chartOfAccountId) return false;
            const acc = accountMap.get(p.chartOfAccountId);
            return acc && acc.code.startsWith(prefix);
          }).reduce((s, p) => s + parseFloat(p.amount), 0);
        }

        function sumRecByPrefix(prefix: string) {
          return recs.filter(r => {
            if (!r.chartOfAccountId) return false;
            const acc = accountMap.get(r.chartOfAccountId);
            return acc && acc.code.startsWith(prefix);
          }).reduce((s, r) => s + parseFloat(r.amount), 0);
        }

        const receitaServicos = sumRecByPrefix("1.1");
        const receitaPecas = sumRecByPrefix("1.2");
        const outrasReceitas = sumRecByPrefix("1.3");
        const receitaBruta = receitaServicos + receitaPecas + outrasReceitas;
        const deducoes = sumPayByPrefix("3.6");
        const receitaLiquida = receitaBruta - deducoes;
        const cpv = sumPayByPrefix("2.");
        const lucroBruto = receitaLiquida - cpv;
        const despesasPessoal = sumPayByPrefix("3.1");
        const despesasInstalacoes = sumPayByPrefix("3.2");
        const despesasEquipamentos = sumPayByPrefix("3.3");
        const despesasAdm = sumPayByPrefix("3.4");
        const despesasComercial = sumPayByPrefix("3.5");
        const despesasDiversas = sumPayByPrefix("3.8");
        const totalDespesasOp = despesasPessoal + despesasInstalacoes + despesasEquipamentos + despesasAdm + despesasComercial + despesasDiversas;
        const resultadoOperacional = lucroBruto - totalDespesasOp;
        const despesasFinanceiras = sumPayByPrefix("3.7");
        const resultadoLiquido = resultadoOperacional - despesasFinanceiras;

        return {
          receitaBruta, deducoes, receitaLiquida, cpv, lucroBruto,
          despesasPessoal, despesasInstalacoes, despesasEquipamentos,
          despesasAdm, despesasComercial, despesasDiversas, totalDespesasOp,
          resultadoOperacional, despesasFinanceiras, resultadoLiquido,
        };
      }

      const current = await calcPeriod(input.from, input.to);
      const previous = input.compareFrom && input.compareTo
        ? await calcPeriod(input.compareFrom, input.compareTo)
        : null;

      return { current, previous };
    }),

  // ── Dashboard Financeiro ───────────────────────────────────────────────────
  dashboardFinanceiro: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = await resolveTenant(ctx.user.id);
    const db = await getDb();
    if (!db) return null;

    const today = toDateStr(new Date());
    const in30 = toDateStr(new Date(Date.now() + 30 * 86400000));
    const monthStart = today.slice(0, 7) + "-01";

    const [accounts, recNext30, payNext30, recMonth, payMonth, overdueRec, overduePay] = await Promise.all([
      db.select().from(bankAccounts)
        .where(and(eq(bankAccounts.tenantId, tenantId), eq(bankAccounts.isActive, true))),
      db.select().from(receivables)
        .where(and(eq(receivables.tenantId, tenantId), eq(receivables.status, "pending"), gte(receivables.dueDate, today), lte(receivables.dueDate, in30))),
      db.select().from(payables)
        .where(and(eq(payables.tenantId, tenantId), eq(payables.status, "pending"), gte(payables.dueDate, today), lte(payables.dueDate, in30))),
      db.select().from(receivables)
        .where(and(eq(receivables.tenantId, tenantId), eq(receivables.status, "received"), gte(receivables.receivedDate, monthStart), lte(receivables.receivedDate, today))),
      db.select().from(payables)
        .where(and(eq(payables.tenantId, tenantId), eq(payables.status, "paid"), gte(payables.paidDate, monthStart), lte(payables.paidDate, today))),
      db.select().from(receivables)
        .where(and(eq(receivables.tenantId, tenantId), eq(receivables.status, "pending"), lte(receivables.dueDate, today))),
      db.select().from(payables)
        .where(and(eq(payables.tenantId, tenantId), eq(payables.status, "pending"), lte(payables.dueDate, today))),
    ]);

    const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.currentBalance), 0);
    const toReceive30 = recNext30.reduce((s, r) => s + parseFloat(r.amount), 0);
    const toPay30 = payNext30.reduce((s, p) => s + parseFloat(p.amount), 0);
    const monthRevenue = recMonth.reduce((s, r) => s + parseFloat(r.amount), 0);
    const monthExpenses = payMonth.reduce((s, p) => s + parseFloat(p.amount), 0);

    // Gráfico 6 meses
    const sixMonthsData: { month: string; revenue: number; expenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(1);
      d.setUTCMonth(d.getUTCMonth() - i);
      const mStart = toDateStr(d);
      const mEnd = new Date(d);
      mEnd.setUTCMonth(mEnd.getUTCMonth() + 1);
      mEnd.setUTCDate(0);
      const mEndStr = toDateStr(mEnd);
      const [mRec, mPay] = await Promise.all([
        db.select().from(receivables)
          .where(and(eq(receivables.tenantId, tenantId), eq(receivables.status, "received"), gte(receivables.receivedDate, mStart), lte(receivables.receivedDate, mEndStr))),
        db.select().from(payables)
          .where(and(eq(payables.tenantId, tenantId), eq(payables.status, "paid"), gte(payables.paidDate, mStart), lte(payables.paidDate, mEndStr))),
      ]);
      sixMonthsData.push({
        month: mStart.slice(0, 7),
        revenue: mRec.reduce((s, r) => s + parseFloat(r.amount), 0),
        expenses: mPay.reduce((s, p) => s + parseFloat(p.amount), 0),
      });
    }

    return {
      totalBalance,
      toReceive30,
      toPay30,
      monthRevenue,
      monthExpenses,
      monthResult: monthRevenue - monthExpenses,
      sixMonthsData,
      overdueReceivables: overdueRec.length,
      overduePayables: overduePay.length,
      accounts: accounts.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        currentBalance: parseFloat(a.currentBalance),
      })),
    };
  }),
});
