/**
 * server/jwt.ts
 * Helpers para assinar e verificar JWTs do Assist-Pró (auth próprio).
 */
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { ENV } from "./_core/env";

const SECRET = new TextEncoder().encode(ENV.cookieSecret || "assist-pro-secret-fallback");
const ISSUER = "assist-pro";
const AUDIENCE = "assist-pro-app";
const EXPIRY = "365d";
const IMPERSONATE_EXPIRY = "1h";

export interface AssistJwtPayload extends JWTPayload {
  userId: number;
  email: string;
  name: string;
  role: string;
  tenantId?: number;
  tenantSlug?: string;
  isImpersonating?: boolean;
  impersonatedBy?: number;
}

export interface JwtPayload {
  sub: number;
  email: string;
  name: string;
  role: string;
  tenantId?: number;
  tenantSlug?: string;
  isImpersonating?: boolean;
  impersonatedBy?: number;
}

export async function signJwt(payload: JwtPayload): Promise<string> {
  const claims: AssistJwtPayload = {
    sub: String(payload.sub),
    userId: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    tenantId: payload.tenantId,
    tenantSlug: payload.tenantSlug,
  };
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(EXPIRY)
    .sign(SECRET);
}

/**
 * Gera um JWT de impersonation com expiração curta (1h).
 * O token carrega o userId e tenantId do tenant-alvo,
 * mas marca isImpersonating=true e impersonatedBy=adminId.
 */
export async function signImpersonateJwt(params: {
  adminId: number;
  targetUserId: number;
  targetEmail: string;
  targetName: string;
  targetTenantId: number;
  targetTenantSlug: string;
}): Promise<string> {
  const claims: AssistJwtPayload = {
    sub: String(params.targetUserId),
    userId: params.targetUserId,
    email: params.targetEmail,
    name: params.targetName,
    role: "manager", // impersonation sempre entra como manager
    tenantId: params.targetTenantId,
    tenantSlug: params.targetTenantSlug,
    isImpersonating: true,
    impersonatedBy: params.adminId,
  };
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(IMPERSONATE_EXPIRY)
    .sign(SECRET);
}

export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    const p = payload as AssistJwtPayload;
    return {
      sub: p.userId ?? Number(p.sub),
      email: p.email,
      name: p.name,
      role: p.role,
      tenantId: p.tenantId,
      tenantSlug: p.tenantSlug,
      isImpersonating: p.isImpersonating,
      impersonatedBy: p.impersonatedBy,
    };
  } catch {
    return null;
  }
}
