/**
 * server/tenant-ctx.ts
 * Helper para extrair tenantId do contexto de uma request autenticada.
 * Suporta tanto o fluxo Manus OAuth quanto o JWT próprio do Assist-Pró.
 */
import type { TrpcContext } from "./_core/context";
import { verifyJwt } from "./jwt";
import { COOKIE_NAME } from "../shared/const";

/**
 * Extrai o tenantId do contexto tRPC.
 * Primeiro tenta via cookie JWT próprio, depois via ctx.user (Manus OAuth).
 */
export function getTenantFromCtx(ctx: TrpcContext): number | null {
  // Tentar extrair do cookie JWT próprio
  const cookie = ctx.req?.cookies?.[COOKIE_NAME] as string | undefined;
  if (cookie) {
    // Verificação síncrona não é possível com jose, então usamos o user do ctx
    // O tenantId é injetado no JWT pelo lead.register/login
  }

  // Fallback: verificar se o user tem tenantId via extensão do ctx
  const extCtx = ctx as TrpcContext & { tenantId?: number };
  if (extCtx.tenantId) return extCtx.tenantId;

  return null;
}

/**
 * Extrai tenantId do cookie JWT de forma assíncrona.
 */
export async function getTenantIdFromCookie(req: TrpcContext["req"]): Promise<number | null> {
  try {
    const cookieHeader = req?.headers?.cookie as string | undefined;
    if (!cookieHeader) return null;

    // Parse manual do cookie
    const cookies: Record<string, string> = {};
    cookieHeader.split(";").forEach((c) => {
      const [k, v] = c.trim().split("=");
      if (k && v) cookies[k.trim()] = decodeURIComponent(v.trim());
    });

    const token = cookies[COOKIE_NAME];
    if (!token) return null;

    const payload = await verifyJwt(token);
    return payload?.tenantId ?? null;
  } catch {
    return null;
  }
}
