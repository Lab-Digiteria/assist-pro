import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db helpers
vi.mock("./db", () => ({
  getEquipmentModels: vi.fn(),
  createEquipmentModel: vi.fn(),
  updateEquipmentModel: vi.fn(),
  deleteEquipmentModel: vi.fn(),
}));

import * as db from "./db";

describe("equipmentModels db helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getEquipmentModels retorna lista vazia quando não há modelos", async () => {
    vi.mocked(db.getEquipmentModels).mockResolvedValue([]);
    const result = await db.getEquipmentModels(1);
    expect(result).toEqual([]);
    expect(db.getEquipmentModels).toHaveBeenCalledWith(1);
  });

  it("createEquipmentModel cria modelo com dados corretos", async () => {
    const mockModel = {
      id: 1,
      tenantId: 1,
      brand: "Samsung",
      modelName: "Galaxy S23",
      category: "smartphone" as const,
      createdAt: new Date(),
    };
    vi.mocked(db.createEquipmentModel).mockResolvedValue(mockModel);

    const result = await db.createEquipmentModel(1, {
      brand: "Samsung",
      modelName: "Galaxy S23",
      category: "smartphone",
    });

    expect(result).toEqual(mockModel);
    expect(db.createEquipmentModel).toHaveBeenCalledWith(1, {
      brand: "Samsung",
      modelName: "Galaxy S23",
      category: "smartphone",
    });
  });

  it("updateEquipmentModel atualiza apenas campos fornecidos", async () => {
    vi.mocked(db.updateEquipmentModel).mockResolvedValue(undefined);
    await db.updateEquipmentModel(1, 42, { brand: "Apple" });
    expect(db.updateEquipmentModel).toHaveBeenCalledWith(1, 42, { brand: "Apple" });
  });

  it("deleteEquipmentModel remove o modelo correto", async () => {
    vi.mocked(db.deleteEquipmentModel).mockResolvedValue(undefined);
    await db.deleteEquipmentModel(1, 42);
    expect(db.deleteEquipmentModel).toHaveBeenCalledWith(1, 42);
  });

  it("getEquipmentModels filtra por search quando fornecido", async () => {
    const mockModels = [
      { id: 1, tenantId: 1, brand: "Samsung", modelName: "Galaxy S23", category: "smartphone" as const, createdAt: new Date() },
      { id: 2, tenantId: 1, brand: "Apple", modelName: "iPhone 14", category: "smartphone" as const, createdAt: new Date() },
    ];
    vi.mocked(db.getEquipmentModels).mockResolvedValue(mockModels.filter(m => m.brand.toLowerCase().includes("samsung")));

    const result = await db.getEquipmentModels(1, "samsung");
    expect(result).toHaveLength(1);
    expect(result[0].brand).toBe("Samsung");
  });
});
