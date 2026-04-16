import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { parse as parseCookies } from "cookie";
import type { User } from "../../drizzle/schema";
import { COOKIE_NAME, IMPERSONATE_COOKIE_NAME } from "../../shared/const";
import { getUserById } from "../db";
import { verifyJwt } from "../jwt";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  tenantId: number | null;
  isImpersonating: boolean;
  impersonatedBy?: number;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let tenantId: number | null = null;

  const rawCookies = parseCookies(opts.req.headers.cookie ?? "");

  // 1. Verificar cookie de impersonation (ap_impersonate) — tem prioridade
  //    O admin continua logado com o cookie normal; o impersonate sobrepõe o contexto do tenant
  try {
    const impersonateToken = rawCookies[IMPERSONATE_COOKIE_NAME];
    if (impersonateToken) {
      const payload = await verifyJwt(impersonateToken);
      if (payload && payload.sub && payload.tenantId && payload.isImpersonating) {
        const dbUser = await getUserById(payload.sub);
        if (dbUser) {
          return {
            req: opts.req,
            res: opts.res,
            user: dbUser,
            tenantId: payload.tenantId,
            isImpersonating: true,
            impersonatedBy: payload.impersonatedBy,
          };
        }
      }
    }
  } catch {
    // Cookie de impersonation inválido ou expirado — continuar normalmente
  }

  // 2. Tentar JWT próprio do Assist-Pró (contém userId + tenantId)
  try {
    const token = rawCookies[COOKIE_NAME];
    if (token) {
      const payload = await verifyJwt(token);
      if (payload && payload.sub && payload.tenantId) {
        const dbUser = await getUserById(payload.sub);
        if (dbUser) {
          user = dbUser;
          tenantId = payload.tenantId;
          return {
            req: opts.req,
            res: opts.res,
            user,
            tenantId,
            isImpersonating: false,
          };
        }
      }
    }
  } catch {
    // Não é um JWT próprio — tentar Manus OAuth
  }

  // 3. Fallback: Manus OAuth (fluxo original)
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    user = null;
  }

  return { req: opts.req, res: opts.res, user, tenantId, isImpersonating: false };
}
