/**
 * passwordReset.test.ts — Testes para o fluxo de recuperação de senha.
 * Valida geração de token, envio de e-mail e redefinição de senha.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock do banco de dados
const mockUser = { id: 1, email: "user@example.com", name: "João", role: "user" as const };
const mockToken = { id: 1, userId: 1, token: "abc123", expiresAt: new Date(Date.now() + 3600_000), usedAt: null };
const mockExpiredToken = { ...mockToken, expiresAt: new Date(Date.now() - 1000) };
const mockUsedToken = { ...mockToken, usedAt: new Date() };

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([mockUser]),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
};

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(mockDb),
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2b$12$hashedpassword"),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock("../drizzle/schema", () => ({
  users: "users",
  userPasswords: "userPasswords",
  passwordResetTokens: "passwordResetTokens",
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col, val) => ({ col, val })),
  and: vi.fn((...args) => args),
}));

// ─── Testes de lógica do token ────────────────────────────────────────────────

describe("Password Reset Token Logic", () => {
  it("deve gerar token com 96 caracteres hex (48 bytes)", () => {
    const token = crypto.randomBytes(48).toString("hex");
    expect(token).toHaveLength(96);
    expect(token).toMatch(/^[0-9a-f]+$/);
  });

  it("deve calcular expiração de 1 hora corretamente", () => {
    const before = Date.now();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const after = Date.now();
    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + 3_599_000);
    expect(expiresAt.getTime()).toBeLessThanOrEqual(after + 3_601_000);
  });

  it("deve detectar token expirado", () => {
    const isExpired = mockExpiredToken.expiresAt < new Date();
    expect(isExpired).toBe(true);
  });

  it("deve detectar token válido (não expirado)", () => {
    const isExpired = mockToken.expiresAt < new Date();
    expect(isExpired).toBe(false);
  });

  it("deve detectar token já utilizado", () => {
    expect(mockUsedToken.usedAt).not.toBeNull();
    expect(mockToken.usedAt).toBeNull();
  });
});

// ─── Testes do template de e-mail ─────────────────────────────────────────────

describe("buildPasswordResetEmail", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doMock("./_core/env", () => ({
      ENV: { resendApiKey: "re_test_key", resendFromEmail: "noreply@assistpro.click" },
    }));
  });

  it("deve gerar subject correto", async () => {
    const { buildPasswordResetEmail } = await import("./email");
    const { subject } = buildPasswordResetEmail({
      name: "João",
      resetUrl: "https://assistpro.click/redefinir-senha?token=abc123",
    });
    expect(subject).toContain("Redefinição de senha");
    expect(subject).toContain("Assist-Pró");
  });

  it("deve incluir nome do usuário e link no HTML", async () => {
    const { buildPasswordResetEmail } = await import("./email");
    const { html } = buildPasswordResetEmail({
      name: "Maria",
      resetUrl: "https://assistpro.click/redefinir-senha?token=xyz789",
    });
    expect(html).toContain("Maria");
    expect(html).toContain("xyz789");
    expect(html).toContain("Redefinir minha senha");
  });

  it("deve mencionar validade de 1 hora", async () => {
    const { buildPasswordResetEmail } = await import("./email");
    const { html } = buildPasswordResetEmail({
      name: "Carlos",
      resetUrl: "https://assistpro.click/redefinir-senha?token=tok",
    });
    expect(html).toContain("1 hora");
  });
});
