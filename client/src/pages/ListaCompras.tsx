import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  ShoppingCart,
  PackageCheck,
  Truck,
  Clock,
  Trash2,
  Filter,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ─── Constantes ───────────────────────────────────────────────────────────────
const REASON_LABELS: Record<string, string> = {
  os_demand: "Demanda de OS",
  stock_replenishment: "Reposição de Estoque",
  other: "Outro",
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  high:   { label: "Alta",   color: "bg-red-100 text-red-700 border-red-200" },
  medium: { label: "Média",  color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  low:    { label: "Baixa",  color: "bg-green-100 text-green-700 border-green-200" },
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending:  { label: "Pendente",          icon: <Clock className="w-3.5 h-3.5" />,        color: "bg-gray-100 text-gray-700" },
  ordered:  { label: "Pedido Realizado",  icon: <Truck className="w-3.5 h-3.5" />,        color: "bg-blue-100 text-blue-700" },
  received: { label: "Recebido",          icon: <PackageCheck className="w-3.5 h-3.5" />, color: "bg-green-100 text-green-700" },
};

const BLANK_FORM = {
  itemDescription: "",
  quantityNeeded: 1,
  reason: "stock_replenishment" as const,
  priority: "medium" as const,
  pecaId: undefined as number | undefined,
  notes: "",
};

// ─── Formulário de novo item (fora do componente pai para evitar re-mount) ────
function NovoItemForm({
  form,
  setForm,
  pecas,
  onSubmit,
  isPending,
}: {
  form: typeof BLANK_FORM;
  setForm: (f: typeof BLANK_FORM) => void;
  pecas: { id: number; nome: string; codigo: string }[];
  onSubmit: () => void;
  isPending: boolean;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Descrição do Item *</Label>
        <Input
          placeholder="Ex: Tela Samsung S23, Bateria iPhone 14..."
          value={form.itemDescription}
          onChange={(e) => setForm({ ...form, itemDescription: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Quantidade</Label>
          <Input
            type="number"
            min={1}
            value={form.quantityNeeded}
            onChange={(e) => setForm({ ...form, quantityNeeded: parseInt(e.target.value) || 1 })}
          />
        </div>
        <div>
          <Label>Prioridade</Label>
          <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Motivo</Label>
        <Select value={form.reason} onValueChange={(v) => setForm({ ...form, reason: v as any })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="stock_replenishment">Reposição de Estoque</SelectItem>
            <SelectItem value="os_demand">Demanda de OS</SelectItem>
            <SelectItem value="other">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Vincular a peça do estoque (opcional) */}
      {pecas.length > 0 && (
        <div>
          <Label>Vincular a Peça do Estoque (opcional)</Label>
          <Select
            value={form.pecaId ? String(form.pecaId) : "none"}
            onValueChange={(v) => setForm({ ...form, pecaId: v === "none" ? undefined : Number(v) })}
          >
            <SelectTrigger><SelectValue placeholder="Selecionar peça..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma</SelectItem>
              {pecas.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.nome} <span className="text-muted-foreground font-mono text-xs">({p.codigo})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Ao vincular, a entrada no estoque pode ser feita automaticamente ao marcar como recebido.
          </p>
        </div>
      )}

      <div>
        <Label>Observações</Label>
        <Textarea
          placeholder="Fornecedor preferido, link, especificações..."
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
          className="resize-none"
        />
      </div>

      <Button
        className="w-full"
        style={{ background: "#1B4F8A" }}
        onClick={onSubmit}
        disabled={isPending || !form.itemDescription.trim()}
      >
        {isPending ? "Adicionando..." : "Adicionar à Lista"}
      </Button>
    </div>
  );
}

// ─── Modal de recebimento ─────────────────────────────────────────────────────
function ReceiveModal({
  item,
  open,
  onClose,
  onConfirm,
  isPending,
}: {
  item: { id: number; itemDescription: string; quantityNeeded: number; pecaId: number | null } | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (addToStock: boolean, qty: number) => void;
  isPending: boolean;
}) {
  const [addToStock, setAddToStock] = useState(false);
  const [qty, setQty] = useState(item?.quantityNeeded ?? 1);

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Recebimento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Confirmar recebimento de: <strong>{item.itemDescription}</strong>
          </p>

          {item.pecaId && (
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
              <Checkbox
                id="addToStock"
                checked={addToStock}
                onCheckedChange={(v) => setAddToStock(Boolean(v))}
              />
              <div className="space-y-1">
                <Label htmlFor="addToStock" className="cursor-pointer font-medium">
                  Dar entrada automática no estoque
                </Label>
                <p className="text-xs text-muted-foreground">
                  Incrementa a quantidade da peça vinculada no estoque.
                </p>
              </div>
            </div>
          )}

          {addToStock && item.pecaId && (
            <div>
              <Label>Quantidade recebida</Label>
              <Input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(parseInt(e.target.value) || 1)}
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              className="flex-1"
              style={{ background: "#1B4F8A" }}
              disabled={isPending}
              onClick={() => onConfirm(addToStock, qty)}
            >
              {isPending ? "Confirmando..." : "Confirmar Recebimento"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ListaCompras() {
  const [open, setOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [form, setForm] = useState(BLANK_FORM);
  const [receiveItem, setReceiveItem] = useState<{
    id: number; itemDescription: string; quantityNeeded: number; pecaId: number | null;
  } | null>(null);

  const utils = trpc.useUtils();

  const { data: items = [], isLoading } = trpc.listaCompras.list.useQuery({
    status: filterStatus !== "all" ? (filterStatus as any) : undefined,
    priority: filterPriority !== "all" ? (filterPriority as any) : undefined,
  });

  const { data: pecas = [] } = trpc.estoque.list.useQuery({});

  const create = trpc.listaCompras.create.useMutation({
    onSuccess: () => {
      toast.success("Item adicionado à lista de compras!");
      setOpen(false);
      setForm(BLANK_FORM);
      utils.listaCompras.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const markOrdered = trpc.listaCompras.markOrdered.useMutation({
    onSuccess: () => {
      toast.success("Marcado como pedido realizado!");
      utils.listaCompras.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const markReceived = trpc.listaCompras.markReceived.useMutation({
    onSuccess: (_, vars) => {
      toast.success(
        vars.addToStock
          ? "Recebido! Estoque atualizado automaticamente."
          : "Marcado como recebido!"
      );
      setReceiveItem(null);
      utils.listaCompras.list.invalidate();
      if (vars.addToStock) utils.estoque.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const remove = trpc.listaCompras.delete.useMutation({
    onSuccess: () => {
      toast.success("Item removido.");
      utils.listaCompras.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  // Contadores por status
  const counts = {
    pending: items.filter((i) => i.status === "pending").length,
    ordered: items.filter((i) => i.status === "ordered").length,
    received: items.filter((i) => i.status === "received").length,
  };

  return (
    <AppLayout title="Lista de Compras">
      <div className="space-y-4">
        {/* KPIs rápidos */}
        <div className="grid grid-cols-3 gap-3">
          {(["pending", "ordered", "received"] as const).map((s) => {
            const cfg = STATUS_CONFIG[s];
            return (
              <Card
                key={s}
                className={`cursor-pointer transition-all ${filterStatus === s ? "ring-2 ring-primary" : ""}`}
                onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
              >
                <CardContent className="p-3 flex items-center gap-2">
                  <span className={`p-1.5 rounded-full ${cfg.color}`}>{cfg.icon}</span>
                  <div>
                    <p className="text-lg font-bold leading-none">{counts[s]}</p>
                    <p className="text-xs text-muted-foreground">{cfg.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Barra de filtros e ação */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9 text-sm w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="ordered">Pedido Realizado</SelectItem>
              <SelectItem value="received">Recebido</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="h-9 text-sm w-40">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as prioridades</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1" />

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button style={{ background: "#1B4F8A" }}>
                <Plus className="w-4 h-4 mr-2" />Adicionar Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Novo Item para Comprar</DialogTitle></DialogHeader>
              <NovoItemForm
                form={form}
                setForm={setForm}
                pecas={pecas}
                onSubmit={() =>
                  create.mutate({
                    ...form,
                    notes: form.notes || undefined,
                  })
                }
                isPending={create.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de itens */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhum item na lista de compras.</p>
            <p className="text-sm mt-1">Adicione itens que precisam ser comprados.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {items.map((item) => {
              const pCfg = PRIORITY_CONFIG[item.priority];
              const sCfg = STATUS_CONFIG[item.status];
              const pecaVinculada = pecas.find((p) => p.id === item.pecaId);

              return (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">{item.itemDescription}</p>
                          <Badge className={`text-xs border ${pCfg.color}`}>{pCfg.label}</Badge>
                          <Badge className={`text-xs flex items-center gap-1 ${sCfg.color}`}>
                            {sCfg.icon}{sCfg.label}
                          </Badge>
                        </div>

                        <div className="flex gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                          <span>Qtd: <strong className="text-foreground">{item.quantityNeeded}</strong></span>
                          <span>{REASON_LABELS[item.reason]}</span>
                          {pecaVinculada && (
                            <span className="text-primary font-medium">
                              Peça: {pecaVinculada.nome}
                            </span>
                          )}
                        </div>

                        {item.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic line-clamp-1">
                            {item.notes}
                          </p>
                        )}
                      </div>

                      {/* Ações */}
                      <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end">
                        {item.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            disabled={markOrdered.isPending}
                            onClick={() => markOrdered.mutate({ id: item.id })}
                          >
                            <Truck className="w-3.5 h-3.5 mr-1" />Pedido
                          </Button>
                        )}
                        {item.status !== "received" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() =>
                              setReceiveItem({
                                id: item.id,
                                itemDescription: item.itemDescription,
                                quantityNeeded: item.quantityNeeded,
                                pecaId: item.pecaId ?? null,
                              })
                            }
                          >
                            <PackageCheck className="w-3.5 h-3.5 mr-1" />Recebido
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10"
                          disabled={remove.isPending}
                          onClick={() => remove.mutate({ id: item.id })}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de recebimento */}
      <ReceiveModal
        item={receiveItem}
        open={!!receiveItem}
        onClose={() => setReceiveItem(null)}
        onConfirm={(addToStock, qty) =>
          receiveItem &&
          markReceived.mutate({
            id: receiveItem.id,
            addToStock,
            quantityReceived: qty,
          })
        }
        isPending={markReceived.isPending}
      />
    </AppLayout>
  );
}
