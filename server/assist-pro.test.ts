import { describe, expect, it } from "vitest";
import { validateCPF, validateCNPJ, validateIMEI, generateOsNumber, generateSlug, generatePartCode, OS_STATUS_LABELS, FORMA_PAGAMENTO_LABELS, PLANS } from "../shared/utils";

// ─── CPF Validation ───────────────────────────────────────────────────────────
describe("validateCPF", () => {
  it("validates a known valid CPF", () => {
    expect(validateCPF("529.982.247-25")).toBe(true);
  });
  it("rejects all-same-digit CPF", () => {
    expect(validateCPF("111.111.111-11")).toBe(false);
  });
  it("rejects wrong check digits", () => {
    expect(validateCPF("529.982.247-26")).toBe(false);
  });
  it("rejects CPF with wrong length", () => {
    expect(validateCPF("123")).toBe(false);
  });
});

// ─── CNPJ Validation ──────────────────────────────────────────────────────────
describe("validateCNPJ", () => {
  it("validates a known valid CNPJ", () => {
    expect(validateCNPJ("11.222.333/0001-81")).toBe(true);
  });
  it("rejects all-same-digit CNPJ", () => {
    expect(validateCNPJ("11.111.111/1111-11")).toBe(false);
  });
  it("rejects CNPJ with wrong length", () => {
    expect(validateCNPJ("123")).toBe(false);
  });
});

// ─── IMEI Validation ──────────────────────────────────────────────────────────
describe("validateIMEI", () => {
  it("validates a known valid IMEI (15 digits, Luhn)", () => {
    // IMEI that passes Luhn: 490154203237518
    expect(validateIMEI("490154203237518")).toBe(true);
  });
  it("rejects IMEI with wrong length", () => {
    expect(validateIMEI("12345")).toBe(false);
  });
  it("rejects IMEI with invalid Luhn", () => {
    expect(validateIMEI("490154203237519")).toBe(false);
  });
});

// ─── OS Number Generator ──────────────────────────────────────────────────────
describe("generateOsNumber", () => {
  it("generates correct format OS-YYYY-NNNN", () => {
    const year = new Date().getFullYear();
    expect(generateOsNumber(1)).toBe(`OS-${year}-0001`);
    expect(generateOsNumber(42)).toBe(`OS-${year}-0042`);
    expect(generateOsNumber(9999)).toBe(`OS-${year}-9999`);
  });
  it("pads counter to 4 digits", () => {
    const year = new Date().getFullYear();
    expect(generateOsNumber(5)).toBe(`OS-${year}-0005`);
  });
});

// ─── Part Code Generator ──────────────────────────────────────────────────────
describe("generatePartCode", () => {
  it("generates correct format PÇ-NNNNNN", () => {
    expect(generatePartCode(1)).toBe("PÇ-000001");
    expect(generatePartCode(100)).toBe("PÇ-000100");
  });
});

// ─── Slug Generator ───────────────────────────────────────────────────────────
describe("generateSlug", () => {
  it("converts name to lowercase slug", () => {
    expect(generateSlug("Assistência Técnica do João")).toBe("assistencia-tecnica-do-joao");
  });
  it("removes special characters", () => {
    expect(generateSlug("Tech & Fix!")).toBe("tech-fix");
  });
  it("trims leading/trailing dashes", () => {
    expect(generateSlug("  Hello World  ")).toBe("hello-world");
  });
});

// ─── Status Labels ────────────────────────────────────────────────────────────
describe("OS_STATUS_LABELS", () => {
  it("has all required statuses", () => {
    const required = ["recebido", "em_diagnostico", "aguardando_aprovacao", "em_reparo", "concluido", "pronto_aguardando_retirada", "encerrado", "cancelado", "devolvido_sem_reparo"];
    required.forEach(s => {
      expect(OS_STATUS_LABELS[s]).toBeTruthy();
    });
  });
});

// ─── Payment Labels ───────────────────────────────────────────────────────────
describe("FORMA_PAGAMENTO_LABELS", () => {
  it("has all required payment methods", () => {
    const required = ["dinheiro", "pix", "cartao_debito", "cartao_credito", "faturamento_direto"];
    required.forEach(f => {
      expect(FORMA_PAGAMENTO_LABELS[f]).toBeTruthy();
    });
  });
});

// ─── Plans Config ─────────────────────────────────────────────────────────────
describe("PLANS", () => {
  it("monthly plan has correct price and trial", () => {
    expect(PLANS.monthly.price).toBe(9900);
    expect(PLANS.monthly.trialDays).toBe(14);
    expect(PLANS.monthly.interval).toBe("month");
  });
  it("annual plan has correct price and trial", () => {
    expect(PLANS.annual.price).toBe(79900);
    expect(PLANS.annual.trialDays).toBe(14);
    expect(PLANS.annual.interval).toBe("year");
  });
  it("lifetime plan has correct price and no trial", () => {
    expect(PLANS.lifetime.price).toBe(149900);
    expect(PLANS.lifetime.trialDays).toBe(0);
    expect(PLANS.lifetime.interval).toBeNull();
  });
});
