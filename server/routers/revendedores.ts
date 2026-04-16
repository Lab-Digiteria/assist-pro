/**
 * server/routers/revendedores.ts
 * Router para o programa de revendas do Assist-Pró.
 * Inclui: registro público, login, dashboard, conversões, comissões e endpoints admin.
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router, adminProcedure } from "../_core/trpc";
import { getDb as getDbAsync } from "../db";
import {
  revendedores,
  referralConversions,
  revendedorCommissions,
} from "../../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "../_core/env";
import bcrypt from "bcryptjs";
import { notifyOwner } from "../_core/notification";
import { sendEmail } from "../email";

const SECRET = new TextEncoder().encode(ENV.cookieSecret || "assist-pro-secret-fallback");
const REVENDEDOR_COOKIE = "ap_revendedor";

// ── Helpers JWT do revendedor ────────────────────────────────────────────────
async function signRevendedorJwt(revendedorId: number, email: string, nome: string): Promise<string> {
  return new SignJWT({ revendedorId, email, nome, type: "revendedor" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("assist-pro")
    .setAudience("assist-pro-revendedor")
    .setExpirationTime("90d")
    .sign(SECRET);
}

async function verifyRevendedorJwt(token: string): Promise<{ revendedorId: number; email: string; nome: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, {
      issuer: "assist-pro",
      audience: "assist-pro-revendedor",
    });
    const p = payload as { revendedorId: number; email: string; nome: string; type: string };
    if (p.type !== "revendedor") return null;
    return { revendedorId: p.revendedorId, email: p.email, nome: p.nome };
  } catch {
    return null;
  }
}

// ── Procedure autenticada do revendedor ─────────────────────────────────────
const revendedorProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const token = (ctx.req as any).cookies?.[REVENDEDOR_COOKIE];
  if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "Login necessário" });
  const payload = await verifyRevendedorJwt(token);
  if (!payload) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão inválida" });
  return next({ ctx: { ...ctx, revendedorId: payload.revendedorId, revendedorEmail: payload.email } });
});

// ── Gerar código de indicação único ─────────────────────────────────────────
function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── Template de e-mail de confirmação ────────────────────────────────────────
function buildRevendedorConfirmationEmail({ nome }: { nome: string }): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Interesse de Revendedor Recebido</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#141414;border-radius:12px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;max-width:600px;">
        <tr><td style="background:linear-gradient(135deg,#1B4F8A,#2563EB);padding:32px 40px;text-align:center;">
          <div style="font-size:28px;font-weight:900;color:#fff;">⚡ Assist-Pró</div>
          <div style="color:rgba(255,255,255,0.7);font-size:13px;margin-top:4px;">Programa de Revendedores</div>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 16px;">Olá, ${nome}! 👋</h2>
          <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 20px;">
            Recebemos seu interesse em fazer parte do <strong style="color:#fff;">Programa de Revendedores do Assist-Pró</strong>.
          </p>
          <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 24px;">
            Nossa equipe irá analisar seu perfil e entrar em contato em breve pelo WhatsApp ou e-mail que você informou.
          </p>
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
          <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0;">© ${new Date().getFullYear()} Assist-Pró. Todos os direitos reservados.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

function buildRevendedorWelcomeEmail({ nome, email, password, referralCode, loginUrl }: {
  nome: string; email: string; password: string; referralCode: string; loginUrl: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Bem-vindo ao Programa de Revendedores</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#141414;border-radius:12px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;max-width:600px;">
        <tr><td style="background:linear-gradient(135deg,#1B4F8A,#2563EB);padding:32px 40px;text-align:center;">
          <div style="font-size:28px;font-weight:900;color:#fff;">⚡ Assist-Pró</div>
          <div style="color:rgba(255,255,255,0.7);font-size:13px;margin-top:4px;">Programa de Revendedores — Acesso Liberado!</div>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 16px;">Bem-vindo, ${nome}! 🎉</h2>
          <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 24px;">
            Seu acesso ao painel de revendedor foi liberado. Aqui estão suas credenciais:
          </p>
          <div style="background:#1a1a1a;border-radius:8px;padding:24px;margin-bottom:24px;border:1px solid rgba(255,255,255,0.06);">
            <div style="margin-bottom:12px;"><span style="color:rgba(255,255,255,0.5);font-size:13px;">E-mail:</span><br><strong style="color:#fff;font-size:15px;">${email}</strong></div>
            <div style="margin-bottom:12px;"><span style="color:rgba(255,255,255,0.5);font-size:13px;">Senha:</span><br><strong style="color:#fff;font-size:15px;">${password}</strong></div>
            <div><span style="color:rgba(255,255,255,0.5);font-size:13px;">Seu código de indicação:</span><br><strong style="color:#E8C547;font-size:20px;letter-spacing:2px;">${referralCode}</strong></div>
          </div>
          <a href="${loginUrl}" style="display:block;background:#2563EB;color:#fff;text-align:center;padding:14px 24px;border-radius:8px;font-weight:700;font-size:15px;text-decoration:none;">Acessar meu painel →</a>
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
          <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0;">© ${new Date().getFullYear()} Assist-Pró. Todos os direitos reservados.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

// ── Router ───────────────────────────────────────────────────────────────────
export const revendedoresRouter = router({
  // Registro público (landing page)
  register: publicProcedure
    .input(z.object({
      nome: z.string().min(2),
      email: z.string().email(),
      whatsapp: z.string().min(10),
      cidade: z.string().min(2),
      estado: z.string().length(2),
      atuacao: z.enum(["consultor_ti", "revendedor_software", "assistencia_tecnica", "agencia_marketing", "outro"]),
      mensagem: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
  const db = await getDbAsync();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const existing = await db.select({ id: revendedores.id })
        .from(revendedores).where(eq(revendedores.email, input.email.toLowerCase())).limit(1);
      if (existing.length > 0) throw new TRPCError({ code: "CONFLICT", message: "Este e-mail já está cadastrado." });
      await db.insert(revendedores).values({
        nome: input.nome,
        email: input.email.toLowerCase(),
        whatsapp: input.whatsapp,
        cidade: input.cidade,
        estado: input.estado.toUpperCase(),
        atuacao: input.atuacao,
        mensagem: input.mensagem ?? null,
        status: "pendente",
      });
      await notifyOwner({
        title: "Novo interesse de revendedor",
        content: `${input.nome} (${input.email}) de ${input.cidade}/${input.estado} quer ser revendedor.`,
      }).catch(() => {});
      await sendEmail({
        to: input.email,
        subject: "Recebemos seu interesse — Programa de Revendedores Assist-Pró",
        html: buildRevendedorConfirmationEmail({ nome: input.nome }),
      }).catch(() => {});
      return { success: true };
    }),

  // Login do revendedor
  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(6) }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDbAsync();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [rev] = await db.select().from(revendedores)
        .where(eq(revendedores.email, input.email.toLowerCase())).limit(1);
      if (!rev || rev.status !== "ativo") {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha incorretos" });
      }
      if (!rev.referralPassword) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Senha não configurada. Contate o suporte." });
      }
      const valid = await bcrypt.compare(input.password, rev.referralPassword);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha incorretos" });
      const token = await signRevendedorJwt(rev.id, rev.email, rev.nome);
      (ctx.res as any).cookie(REVENDEDOR_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 90 * 24 * 60 * 60 * 1000,
        path: "/",
      });
      return { ok: true, nome: rev.nome };
    }),

  // Logout
  logout: publicProcedure.mutation(async ({ ctx }) => {
    (ctx.res as any).clearCookie(REVENDEDOR_COOKIE, { path: "/" });
    return { ok: true };
  }),

  // Dados do revendedor autenticado
  me: revendedorProcedure.query(async ({ ctx }) => {
    const db = await getDbAsync();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [rev] = await db.select({
      id: revendedores.id,
      nome: revendedores.nome,
      email: revendedores.email,
      whatsapp: revendedores.whatsapp,
      cidade: revendedores.cidade,
      estado: revendedores.estado,
      atuacao: revendedores.atuacao,
      status: revendedores.status,
      referralCode: revendedores.referralCode,
      commissionRate: revendedores.commissionRate,
      totalClicks: revendedores.totalClicks,
      createdAt: revendedores.createdAt,
    }).from(revendedores).where(eq(revendedores.id, (ctx as any).revendedorId)).limit(1);
    if (!rev) throw new TRPCError({ code: "NOT_FOUND" });
    return rev;
  }),

  // Dashboard: KPIs
  dashboard: revendedorProcedure.query(async ({ ctx }) => {
    const db = await getDbAsync();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const revendedorId = (ctx as any).revendedorId as number;
    const [rev] = await db.select({
      totalClicks: revendedores.totalClicks,
      referralCode: revendedores.referralCode,
      commissionRate: revendedores.commissionRate,
      nome: revendedores.nome,
    }).from(revendedores).where(eq(revendedores.id, revendedorId)).limit(1);

    const conversions = await db.select().from(referralConversions)
      .where(eq(referralConversions.revendedorId, revendedorId));
    const totalConversions = conversions.length;
    const confirmedConversions = conversions.filter(c => c.status === "confirmed").length;

    const commissions = await db.select().from(revendedorCommissions)
      .where(eq(revendedorCommissions.revendedorId, revendedorId));
    const pendingCommission = commissions
      .filter(c => c.status === "pending")
      .reduce((sum, c) => sum + parseFloat(c.totalValue || "0"), 0);
    const totalCommission = commissions
      .reduce((sum, c) => sum + parseFloat(c.totalValue || "0"), 0);

    return {
      totalClicks: rev?.totalClicks ?? 0,
      referralCode: rev?.referralCode ?? null,
      commissionRate: rev?.commissionRate ?? "20.00",
      nome: rev?.nome ?? "",
      totalConversions,
      confirmedConversions,
      pendingCommission,
      totalCommission,
    };
  }),

  // Lista de conversões
  conversions: revendedorProcedure.query(async ({ ctx }) => {
    const db = await getDbAsync();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const { tenants } = await import("../../drizzle/schema");
    return db.select({
      id: referralConversions.id,
      revendedorId: referralConversions.revendedorId,
      tenantId: referralConversions.tenantId,
      status: referralConversions.status,
      planName: referralConversions.planName,
      planValue: referralConversions.planValue,
      commissionRate: referralConversions.commissionRate,
      commissionValue: referralConversions.commissionValue,
      createdAt: referralConversions.createdAt,
      confirmedAt: referralConversions.confirmedAt,
      tenantNome: tenants.name,
      tenantEmail: tenants.email,
    }).from(referralConversions)
      .leftJoin(tenants, eq(referralConversions.tenantId, tenants.id))
      .where(eq(referralConversions.revendedorId, (ctx as any).revendedorId))
      .orderBy(desc(referralConversions.createdAt));
  }),

  // Lista de comissões por mês
  commissions: revendedorProcedure.query(async ({ ctx }) => {
    const db = await getDbAsync();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db.select().from(revendedorCommissions)
      .where(eq(revendedorCommissions.revendedorId, (ctx as any).revendedorId))
      .orderBy(desc(revendedorCommissions.periodoAno), desc(revendedorCommissions.periodoMes));
  }),

  // Rastrear clique no link de indicação (público)
  trackClick: publicProcedure
    .input(z.object({ referralCode: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDbAsync();
      if (!db) return { ok: true };
      await db.update(revendedores)
        .set({ totalClicks: sql`${revendedores.totalClicks} + 1` })
        .where(eq(revendedores.referralCode, input.referralCode));
      return { ok: true };
    }),

  // ── Admin endpoints ──────────────────────────────────────────────────────
  adminList: adminProcedure.query(async () => {
    const db = await getDbAsync();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db.select().from(revendedores).orderBy(desc(revendedores.createdAt));
  }),

  adminUpdateStatus: adminProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pendente", "ativo", "inativo"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDbAsync();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      let referralCode: string | undefined;
      if (input.status === "ativo") {
        const [existing] = await db.select({ referralCode: revendedores.referralCode })
          .from(revendedores).where(eq(revendedores.id, input.id)).limit(1);
        if (!existing?.referralCode) {
          let code = generateReferralCode();
          for (let i = 0; i < 10; i++) {
            const [dup] = await db.select({ id: revendedores.id })
              .from(revendedores).where(eq(revendedores.referralCode, code)).limit(1);
            if (!dup) break;
            code = generateReferralCode();
          }
          referralCode = code;
        }
      }
      await db.update(revendedores)
        .set({ status: input.status, ...(referralCode ? { referralCode } : {}) })
        .where(eq(revendedores.id, input.id));
      return { ok: true };
    }),

  adminSetPassword: adminProcedure
    .input(z.object({ id: z.number(), password: z.string().min(8) }))
    .mutation(async ({ input }) => {
      const db = await getDbAsync();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const hash = await bcrypt.hash(input.password, 12);
      await db.update(revendedores)
        .set({ referralPassword: hash })
        .where(eq(revendedores.id, input.id));
      return { ok: true };
    }),

  adminSetCommissionRate: adminProcedure
    .input(z.object({ id: z.number(), rate: z.number().min(0).max(100) }))
    .mutation(async ({ input }) => {
      const db = await getDbAsync();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(revendedores)
        .set({ commissionRate: String(input.rate) })
        .where(eq(revendedores.id, input.id));
      return { ok: true };
    }),

  adminListCommissions: adminProcedure.query(async () => {
    const db = await getDbAsync();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db.select({
      id: revendedorCommissions.id,
      revendedorId: revendedorCommissions.revendedorId,
      periodoMes: revendedorCommissions.periodoMes,
      periodoAno: revendedorCommissions.periodoAno,
      totalConversions: revendedorCommissions.totalConversions,
      totalValue: revendedorCommissions.totalValue,
      status: revendedorCommissions.status,
      paidAt: revendedorCommissions.paidAt,
      observacoes: revendedorCommissions.observacoes,
      createdAt: revendedorCommissions.createdAt,
      revendedorNome: revendedores.nome,
      revendedorEmail: revendedores.email,
    }).from(revendedorCommissions)
      .innerJoin(revendedores, eq(revendedorCommissions.revendedorId, revendedores.id))
      .orderBy(desc(revendedorCommissions.periodoAno), desc(revendedorCommissions.periodoMes));
  }),

  adminApproveCommission: adminProcedure
    .input(z.object({ id: z.number(), observacoes: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDbAsync();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(revendedorCommissions)
        .set({ status: "paid", paidAt: new Date(), observacoes: input.observacoes })
        .where(eq(revendedorCommissions.id, input.id));
      return { ok: true };
    }),

  // Ativar revendedor e enviar e-mail de boas-vindas com credenciais
  adminActivateWithCredentials: adminProcedure
    .input(z.object({
      id: z.number(),
      password: z.string().min(8),
      origin: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDbAsync();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [rev] = await db.select().from(revendedores)
        .where(eq(revendedores.id, input.id)).limit(1);
      if (!rev) throw new TRPCError({ code: "NOT_FOUND" });
      const hash = await bcrypt.hash(input.password, 12);
      let referralCode = rev.referralCode;
      if (!referralCode) {
        let code = generateReferralCode();
        for (let i = 0; i < 10; i++) {
          const [dup] = await db.select({ id: revendedores.id })
            .from(revendedores).where(eq(revendedores.referralCode, code)).limit(1);
          if (!dup) break;
          code = generateReferralCode();
        }
        referralCode = code;
      }
      await db.update(revendedores)
        .set({ status: "ativo", referralPassword: hash, referralCode })
        .where(eq(revendedores.id, input.id));
      const loginUrl = `${input.origin}/revendedor/login`;
      await sendEmail({
        to: rev.email,
        subject: "Seu acesso ao Programa de Revendedores Assist-Pró foi liberado!",
        html: buildRevendedorWelcomeEmail({
          nome: rev.nome,
          email: rev.email,
          password: input.password,
          referralCode: referralCode!,
          loginUrl,
        }),
      }).catch(() => {});
      return { ok: true, referralCode };
    }),
});
