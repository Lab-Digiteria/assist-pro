import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { parse as parseCookies } from "cookie";
import type { User } from "../../drizzle/schema";
import { COOKIE_NAME } from "../../shared/const";
import { getUserById } from "../db";
import { verifyJwt } from "../jwt";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  tenantId: number | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let tenantId: number | null = null;

  // 1. Tentar JWT próprio do Assist-Pró (contém userId + tenantId)
  try {
    const rawCookies = parseCookies(opts.req.headers.cookie ?? "");
    const token = rawCookies[COOKIE_NAME];
    if (token) {
      const payload = await verifyJwt(token);
      if (payload && payload.sub && payload.tenantId) {
        const dbUser = await getUserById(payload.sub);
        if (dbUser) {
          user = dbUser;
          tenantId = payload.tenantId;
          return { req: opts.req, res: opts.res, user, tenantId };
        }
      }
    }
  } catch {
    // Não é um JWT próprio — tentar Manus OAuth
  }

  // 2. Fallback: Manus OAuth (fluxo original)
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    user = null;
  }

  return { req: opts.req, res: opts.res, user, tenantId };
}
