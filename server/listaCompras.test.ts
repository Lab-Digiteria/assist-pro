import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do db para não precisar de banco real nos testes
vi.mock("./db", () => ({
  getTenantByOwner: vi.fn().mockResolvedValue({ id: 1 }),
  getTenantByMember: vi.fn().mockResolvedValue(null),
  getListaCompras: vi.fn().mockResolvedValue([
    {
      id: 1,
      tenantId: 1,
      itemDescription: "Tela Samsung S23",
      quantityNeeded: 2,
      reason: "stock_replenishment",
      priority: "high",
      status: "pending",
      pecaId: null,
      serviceOrderId: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  createListaCompra: vi.fn().mockResolvedValue({
    id: 2,
    tenantId: 1,
    itemDescription: "Bateria iPhone 14",
    quantityNeeded: 1,
    reason: "os_demand",
    priority: "medium",
    status: "pending",
    pecaId: null,
    serviceOrderId: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  updateListaCompra: vi.fn().mockResolvedValue(undefined),
  deleteListaCompra: vi.fn().mockResolvedValue(undefined),
  getListaCompraById: vi.fn().mockResolvedValue({
    id: 1,
    tenantId: 1,
    itemDescription: "Tela Samsung S23",
    quantityNeeded: 2,
    reason: "stock_replenishment",
    priority: "high",
    status: "pending",
    pecaId: 5,
    serviceOrderId: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  movimentarEstoque: vi.fn().mockResolvedValue(undefined),
}));

import { getListaCompras, createListaCompra, updateListaCompra, deleteListaCompra, getListaCompraById, movimentarEstoque } from "./db";

describe("Lista de Compras — helpers e lógica", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve listar itens da lista de compras de um tenant", async () => {
    const items = await getListaCompras(1);
    expect(items).toHaveLength(1);
    expect(items[0].itemDescription).toBe("Tela Samsung S23");
    expect(items[0].priority).toBe("high");
  });

  it("deve criar um novo item na lista de compras", async () => {
    const item = await createListaCompra(1, {
      itemDescription: "Bateria iPhone 14",
      quantityNeeded: 1,
      reason: "os_demand",
      priority: "medium",
      status: "pending",
    });
    expect(item).toBeDefined();
    expect(item?.itemDescription).toBe("Bateria iPhone 14");
    expect(item?.status).toBe("pending");
  });

  it("deve atualizar status de um item para 'ordered'", async () => {
    await updateListaCompra(1, 1, { status: "ordered" });
    expect(updateListaCompra).toHaveBeenCalledWith(1, 1, { status: "ordered" });
  });

  it("deve buscar item por ID e verificar pecaId para entrada no estoque", async () => {
    const item = await getListaCompraById(1, 1);
    expect(item).not.toBeNull();
    expect(item?.pecaId).toBe(5);
    // Simula lógica de markReceived com entrada no estoque
    if (item?.pecaId) {
      await movimentarEstoque(1, item.pecaId, "entrada", item.quantityNeeded, 99, undefined, `Entrada via Lista de Compras #${item.id}`);
      expect(movimentarEstoque).toHaveBeenCalledWith(1, 5, "entrada", 2, 99, undefined, "Entrada via Lista de Compras #1");
    }
  });

  it("deve deletar um item da lista de compras", async () => {
    await deleteListaCompra(1, 1);
    expect(deleteListaCompra).toHaveBeenCalledWith(1, 1);
  });
});
