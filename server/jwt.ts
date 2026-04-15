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

export interface AssistJwtPayload extends JWTPayload {
  userId: number;
  email: string;
  name: string;
  role: string;
  tenantId?: number;
  tenantSlug?: string;
}

export interface JwtPayload {
  sub: number;
  email: string;
  name: string;
  role: string;
  tenantId?: number;
  tenantSlug?: string;
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
    };
  } catch {
    return null;
  }
}
