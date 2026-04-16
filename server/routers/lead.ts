/**
 * routers/lead.ts
 * Funil de captação de leads e registro de trial do Assist-Pró.
 * Baseado no SaaS_Core do OficinaPro.
 *
 * Fluxo: formulário da landing page → lead.register →
 *   1. Valida CPF/CNPJ e disponibilidade de e-mail
 *   2. Cria usuário com senha hasheada
 *   3. Cria tenant com slug único
 *   4. Cria subscription (trialing, 14 dias)
 *   5. Registra lead na tabela de leads
 *   6. Seta cookie de sessão JWT
 *   7. Retorna dados de acesso
 */
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  leads,
  plans,
  subscriptions,
  tenantMembers,
  tenants,
  userPasswords,
  users,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";
import { getSessionCookieOptions } from "../_core/cookies";
import { COOKIE_NAME } from "../../shared/const";
import { ENV } from "../_core/env";
import { validateCPF, validateCNPJ } from "../../shared/utils";
import { signJwt } from "../jwt";

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

async function ensureUniqueSlug(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, base: string): Promise<string> {
  let slug = slugify(base);
  let attempt = 0;
  while (true) {
    const candidate = attempt === 0 ? slug : `${slug}-${attempt}`;
    const existing = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, candidate)).limit(1);
    if (existing.length === 0) return candidate;
    attempt++;
  }
}

async function getDefaultPlan(db: NonNullable<Awaited<ReturnType<typeof getDb>>>) {
  // Buscar o plano mensal (slug "mensal") ou o primeiro plano ativo
  const rows = await db.select().from(plans).where(eq(plans.isActive, true)).limit(3);
  const mensal = rows.find((p) => p.slug === "mensal");
  return mensal ?? rows[0] ?? null;
}

export const leadRouter = router({
  /**
   * register — Cadastro público de trial.
   * Cria usuário + tenant + subscription(trialing) + lead em uma operação atômica.
   */
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "Nome muito curto"),
        email: z.string().email("E-mail inválido"),
        password: z.string().min(6, "Mínimo 6 caracteres"),
        companyName: z.string().min(2, "Nome da empresa muito curto"),
        phone: z.string().min(10, "WhatsApp inválido"),
        document: z.string().min(11, "CPF/CNPJ inválido"),
        source: z.string().optional(),
        referralCode: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // 1. Validar CPF/CNPJ
      const rawDoc = input.document.replace(/\D/g, "");
      const isValidDoc = rawDoc.length === 11 ? validateCPF(rawDoc) : rawDoc.length === 14 ? validateCNPJ(rawDoc) : false;
      if (!isValidDoc) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "CPF ou CNPJ inválido" });
      }

      // 2. Verificar disponibilidade de e-mail
      const existingUser = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, input.email.toLowerCase()))
        .limit(1);
      if (existingUser.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "Este e-mail já está cadastrado. Faça login para continuar." });
      }

      // 3. Buscar plano padrão
      const plan = await getDefaultPlan(db);
      if (!plan) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Nenhum plano disponível. Contate o suporte." });
      }

      // 4. Criar usuário
      const passwordHash = await bcrypt.hash(input.password, 12);
      // Usar openId sintético para compatibilidade com a tabela users existente
      const syntheticOpenId = `email:${input.email.toLowerCase()}`;

      await db.insert(users).values({
        openId: syntheticOpenId,
        name: input.name,
        email: input.email.toLowerCase(),
        loginMethod: "email",
        role: "user",
        lastSignedIn: new Date(),
      });

      const [newUser] = await db
        .select()
        .from(users)
        .where(eq(users.openId, syntheticOpenId))
        .limit(1);

      if (!newUser) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar usuário" });

      // Salvar senha hasheada
      await db.insert(userPasswords).values({
        userId: newUser.id,
        passwordHash,
      });

      // 5. Criar tenant
      const slug = await ensureUniqueSlug(db, input.companyName);
      const trialEndsAt = new Date(Date.now() + plan.trialDays * 24 * 60 * 60 * 1000);

      await db.insert(tenants).values({
        name: input.companyName,
        slug,
        ownerUserId: newUser.id,
        cpfCnpj: input.document,
        whatsapp: input.phone,
        email: input.email.toLowerCase(),
        subscriptionStatus: "trial",
        trialEndsAt,
      });

      const [newTenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.slug, slug))
        .limit(1);

      if (!newTenant) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar empresa" });

      // 6. Criar membership (owner)
      await db.insert(tenantMembers).values({
        tenantId: newTenant.id,
        userId: newUser.id,
        role: "manager",
      });

      // 7. Criar subscription
      const subscriptionId = crypto.randomUUID();
      await db.insert(subscriptions).values({
        id: subscriptionId,
        tenantId: newTenant.id,
        planId: plan.id,
        status: "trialing",
        trialEndsAt,
        currentPeriodStartsAt: new Date(),
        currentPeriodEndsAt: trialEndsAt,
      });

      // 8. Registrar lead
      try {
        await db.insert(leads).values({
          name: input.name,
          email: input.email.toLowerCase(),
          whatsapp: input.phone,
          cpfCnpj: input.document,
          source: input.source ?? "landing",
          status: "trial",
          tenantId: newTenant.id,
        });
      } catch {
        // Não bloqueia o cadastro se falhar o registro do lead
      }

      // 9. Registrar conversão do revendedor (se veio por referral)
      if (input.referralCode) {
        try {
          const { revendedores, referralConversions } = await import("../../drizzle/schema");
          const [rev] = await db
            .select({ id: revendedores.id, commissionRate: revendedores.commissionRate })
            .from(revendedores)
            .where(eq(revendedores.referralCode, input.referralCode.toUpperCase()))
            .limit(1);
          if (rev) {
            await db.insert(referralConversions).values({
              revendedorId: rev.id,
              tenantId: newTenant.id,
              status: "pending",
              commissionRate: rev.commissionRate ?? "20.00",
            });
          }
        } catch {
          // Não bloqueia o cadastro se falhar o registro da conversão
        }
      }

      // 10. Notificar owner
      try {
        const { notifyOwner } = await import("../_core/notification");
        await notifyOwner({
          title: `Novo trial: ${input.companyName}`,
          content: [
            `**Nome:** ${input.name}`,
            `**E-mail:** ${input.email}`,
            `**WhatsApp:** ${input.phone}`,
            `**Empresa:** ${input.companyName}`,
            `**CPF/CNPJ:** ${input.document}`,
            `**Plano:** ${plan.name} (${plan.trialDays} dias)`,
            `**Origem:** ${input.source ?? "landing"}`,
          ].join("\n"),
        });
      } catch {
        // Não bloqueia
      }

      // 10. Enviar e-mail de boas-vindas ao tenant
      try {
        const { sendEmail, buildWelcomeEmail } = await import("../email");
        const origin = (ctx.req.headers.origin as string) ?? "https://assistpro.com.br";
        const { subject, html } = buildWelcomeEmail({
          name: input.name,
          companyName: input.companyName,
          trialDays: plan.trialDays,
          loginUrl: `${origin}/login`,
        });
        await sendEmail({ to: input.email, subject, html });
      } catch {
        // Não bloqueia o cadastro
      }

      // 11. Gerar JWT de sessão
      const token = await signJwt({
        sub: newUser.id,
        email: newUser.email ?? "",
        name: newUser.name ?? "",
        role: newUser.role,
        tenantId: newTenant.id,
        tenantSlug: slug,
      });

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      return {
        success: true,
        tenantId: newTenant.id,
        tenantSlug: slug,
        trialDays: plan.trialDays,
        planName: plan.name,
      };
    }),

  /**
   * checkEmail — Verifica disponibilidade de e-mail em tempo real.
   */
  checkEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { available: true };
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, input.email.toLowerCase()))
        .limit(1);
      return { available: existing.length === 0 };
    }),

  /**
   * login — Autenticação por e-mail e senha.
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Buscar usuário
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email.toLowerCase()))
        .limit(1);

      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha incorretos" });
      }

      // Verificar senha
      const [pwRow] = await db
        .select()
        .from(userPasswords)
        .where(eq(userPasswords.userId, user.id))
        .limit(1);

      if (!pwRow) {
        // Usuário criado via Manus OAuth — redirecionar para login OAuth
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Esta conta usa login social. Use o botão 'Entrar com Manus'." });
      }

      const valid = await bcrypt.compare(input.password, pwRow.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha incorretos" });
      }

      // Buscar tenant do usuário
      const [membership] = await db
        .select({ tenantId: tenantMembers.tenantId, role: tenantMembers.role })
        .from(tenantMembers)
        .where(eq(tenantMembers.userId, user.id))
        .limit(1);

      const [tenant] = membership
        ? await db.select().from(tenants).where(eq(tenants.id, membership.tenantId)).limit(1)
        : [];

      // Atualizar lastSignedIn
      await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

      // Gerar JWT
      const token = await signJwt({
        sub: user.id,
        email: user.email ?? "",
        name: user.name ?? "",
        role: user.role,
        tenantId: tenant?.id,
        tenantSlug: tenant?.slug,
      });

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      return {
        success: true,
        tenantId: tenant?.id,
        tenantSlug: tenant?.slug,
      };
    }),
});
