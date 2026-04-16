/**
 * email.test.ts — Valida a integração com o Resend
 * Testa que a API Key está configurada e que o helper de envio funciona
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do módulo resend para não fazer chamadas reais nos testes
vi.mock("resend", () => {
  return {
    Resend: vi.fn().mockImplementation(() => ({
      emails: {
        send: vi.fn().mockResolvedValue({ data: { id: "test-id" }, error: null }),
      },
    })),
  };
});

// Mock do ENV para simular chave configurada
vi.mock("./_core/env", () => ({
  ENV: {
    resendApiKey: "re_test_key",
    resendFromEmail: "onboarding@resend.dev",
  },
}));

describe("Email helper", () => {
  it("deve retornar true ao enviar e-mail com sucesso", async () => {
    const { sendEmail } = await import("./email");
    const result = await sendEmail({
      to: "test@example.com",
      subject: "Teste",
      html: "<p>Teste</p>",
    });
    expect(result).toBe(true);
  });

  it("deve retornar false quando RESEND_API_KEY está vazia", async () => {
    vi.resetModules();
    vi.doMock("./_core/env", () => ({
      ENV: { resendApiKey: "", resendFromEmail: "onboarding@resend.dev" },
    }));
    const { sendEmail } = await import("./email");
    const result = await sendEmail({
      to: "test@example.com",
      subject: "Teste",
      html: "<p>Teste</p>",
    });
    expect(result).toBe(false);
  });

  it("buildWelcomeEmail deve gerar subject e html corretos", async () => {
    vi.resetModules();
    vi.doMock("./_core/env", () => ({
      ENV: { resendApiKey: "re_test_key", resendFromEmail: "onboarding@resend.dev" },
    }));
    const { buildWelcomeEmail } = await import("./email");
    const { subject, html } = buildWelcomeEmail({
      name: "João",
      companyName: "TechFix",
      trialDays: 14,
      loginUrl: "https://assistpro.com.br/login",
    });
    expect(subject).toContain("João");
    expect(subject).toContain("14 dias");
    expect(html).toContain("TechFix");
    expect(html).toContain("Acessar o Assist-Pró");
  });

  it("buildTrialExpiringEmail deve gerar subject com dias restantes", async () => {
    vi.resetModules();
    vi.doMock("./_core/env", () => ({
      ENV: { resendApiKey: "re_test_key", resendFromEmail: "onboarding@resend.dev" },
    }));
    const { buildTrialExpiringEmail } = await import("./email");
    const { subject, html } = buildTrialExpiringEmail({
      name: "Maria",
      companyName: "ElectroFix",
      daysLeft: 3,
      upgradeUrl: "https://assistpro.com.br/configuracoes",
    });
    expect(subject).toContain("3 dia");
    expect(html).toContain("ElectroFix");
    expect(html).toContain("Escolher meu plano agora");
  });

  it("buildPaymentConfirmationEmail deve incluir nome do plano", async () => {
    vi.resetModules();
    vi.doMock("./_core/env", () => ({
      ENV: { resendApiKey: "re_test_key", resendFromEmail: "onboarding@resend.dev" },
    }));
    const { buildPaymentConfirmationEmail } = await import("./email");
    const { subject, html } = buildPaymentConfirmationEmail({
      name: "Carlos",
      companyName: "MobileFix",
      planName: "Plano Mensal",
      amount: "R$99,00",
      loginUrl: "https://assistpro.com.br/login",
    });
    expect(subject).toContain("Plano Mensal");
    expect(html).toContain("R$99,00");
    expect(html).toContain("Carlos");
  });
});
