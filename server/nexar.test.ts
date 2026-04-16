import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do fetch global para não fazer chamadas reais na CI
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Resetar cache do token entre testes
beforeEach(() => {
  vi.resetModules();
  mockFetch.mockReset();
});

describe("Nexar API Integration", () => {
  it("deve retornar found=false quando o part number não existe", async () => {
    // Mock do token
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: "mock-token-123",
        expires_in: 3600,
      }),
    } as any);

    // Mock da consulta GraphQL sem resultados
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          supSearchMpn: {
            results: [],
          },
        },
      }),
    } as any);

    const { lookupPartNumber } = await import("./nexar");
    const result = await lookupPartNumber("INEXISTENTE-9999");

    expect(result.found).toBe(false);
  });

  it("deve retornar dados da peça quando o part number existe", async () => {
    // Mock do token
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: "mock-token-456",
        expires_in: 3600,
      }),
    } as any);

    // Mock da consulta GraphQL com resultado
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          supSearchMpn: {
            results: [
              {
                part: {
                  mpn: "LM358DR",
                  shortDescription: "Op Amp Dual GP ±16V/32V 8-Pin SOIC",
                  manufacturer: { name: "Texas Instruments" },
                  specs: [
                    {
                      attribute: { name: "Supply Voltage - Max" },
                      displayValue: "32V",
                    },
                    {
                      attribute: { name: "Package / Case" },
                      displayValue: "8-SOIC",
                    },
                  ],
                },
              },
            ],
          },
        },
      }),
    } as any);

    const { lookupPartNumber } = await import("./nexar");
    const result = await lookupPartNumber("LM358DR");

    expect(result.found).toBe(true);
    if (result.found) {
      expect(result.mpn).toBe("LM358DR");
      expect(result.manufacturer).toBe("Texas Instruments");
      expect(result.description).toContain("Op Amp");
      expect(result.specs.length).toBeGreaterThan(0);
    }
  });

  it("deve lançar erro quando as credenciais não estão configuradas", async () => {
    const originalClientId = process.env.NEXAR_CLIENT_ID;
    const originalClientSecret = process.env.NEXAR_CLIENT_SECRET;

    delete process.env.NEXAR_CLIENT_ID;
    delete process.env.NEXAR_CLIENT_SECRET;

    const { lookupPartNumber } = await import("./nexar");

    await expect(lookupPartNumber("QUALQUER")).rejects.toThrow(
      "NEXAR_CLIENT_ID e NEXAR_CLIENT_SECRET não configurados"
    );

    process.env.NEXAR_CLIENT_ID = originalClientId;
    process.env.NEXAR_CLIENT_SECRET = originalClientSecret;
  });

  it("deve lançar erro quando a autenticação falha", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    } as any);

    const { lookupPartNumber } = await import("./nexar");

    await expect(lookupPartNumber("QUALQUER")).rejects.toThrow("Nexar auth failed");
  });
});
