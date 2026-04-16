import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, AlertTriangle, Package, X, Filter } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

const CATEGORIAS_PECA = ["tela", "bateria", "conector", "cabo", "placa", "chip", "acessorio", "outro"] as const;
const CAT_LABELS: Record<string, string> = {
  tela: "Tela", bateria: "Bateria", conector: "Conector", cabo: "Cabo",
  placa: "Placa", chip: "Chip", acessorio: "Acessório", outro: "Outro",
};

const BLANK_FORM = {
  nome: "", categoria: "tela" as typeof CATEGORIAS_PECA[number],
  precoCusto: 0, precoVenda: 0, quantidadeAtual: 0, quantidadeMinima: 1,
  partNumber: "", manufacturer: "", application: "",
  compatibleModelIds: [] as number[],
};

// ─── Multi-select de modelos (definido fora para evitar re-mount) ─────────────
function ModelMultiSelect({
  models,
  selected,
  onChange,
}: {
  models: { id: number; brand: string; modelName: string; category: string }[];
  selected: number[];
  onChange: (ids: number[]) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      models.filter(
        (m) =>
          !selected.includes(m.id) &&
          `${m.brand} ${m.modelName}`.toLowerCase().includes(search.toLowerCase())
      ),
    [models, selected, search]
  );

  const selectedModels = models.filter((m) => selected.includes(m.id));

  function toggle(id: number) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <div className="space-y-2">
      {selectedModels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedModels.map((m) => (
            <Badge key={m.id} variant="secondary" className="gap-1 text-xs">
              {m.brand} {m.modelName}
              <button type="button" onClick={() => toggle(m.id)} className="ml-1 hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <Input
        placeholder="Buscar modelo..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-8 text-sm"
      />
      {filtered.length > 0 && (
        <div className="border rounded-md max-h-36 overflow-y-auto">
          {filtered.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => toggle(m.id)}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors"
            >
              <span className="font-medium">{m.brand}</span>{" "}
              <span>{m.modelName}</span>
              <span className="text-xs text-muted-foreground ml-1 capitalize">({m.category})</span>
            </button>
          ))}
        </div>
      )}
      {models.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Nenhum modelo cadastrado. Acesse Configurações → Modelos de Equipamentos para cadastrar.
        </p>
      )}
    </div>
  );
}

// ─── Formulário de peça (definido fora para evitar re-mount) ─────────────────
function PecaForm({
  form,
  setForm,
  models,
  isManager,
  onSubmit,
  isPending,
  submitLabel,
}: {
  form: typeof BLANK_FORM;
  setForm: (f: typeof BLANK_FORM) => void;
  models: { id: number; brand: string; modelName: string; category: string }[];
  isManager: boolean;
  onSubmit: () => void;
  isPending: boolean;
  submitLabel: string;
}) {
  return (
    <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
      <div>
        <Label>Nome *</Label>
        <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
      </div>
      <div>
        <Label>Categoria</Label>
        <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v as any })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIAS_PECA.map((c) => <SelectItem key={c} value={c}>{CAT_LABELS[c]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Part Number e Fabricante */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Part Number</Label>
          <Input
            placeholder="Ex: GH82-12345A"
            value={form.partNumber}
            onChange={(e) => setForm({ ...form, partNumber: e.target.value })}
          />
        </div>
        <div>
          <Label>Fabricante</Label>
          <Input
            placeholder="Ex: Samsung Parts, OEM"
            value={form.manufacturer}
            onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
          />
        </div>
      </div>

      {/* Aplicação */}
      <div>
        <Label>Aplicação / Observações</Label>
        <Textarea
          placeholder="Ex: Compatível com modelos S23 e S23+, requer cola UV..."
          value={form.application}
          onChange={(e) => setForm({ ...form, application: e.target.value })}
          rows={2}
          className="resize-none"
        />
      </div>

      {/* Preços */}
      <div className="grid grid-cols-2 gap-2">
        {isManager && (
          <div>
            <Label>Preço de Custo (R$)</Label>
            <Input type="number" step="0.01" value={form.precoCusto}
              onChange={(e) => setForm({ ...form, precoCusto: parseFloat(e.target.value) || 0 })} />
          </div>
        )}
        <div>
          <Label>Preço de Venda (R$)</Label>
          <Input type="number" step="0.01" value={form.precoVenda}
            onChange={(e) => setForm({ ...form, precoVenda: parseFloat(e.target.value) || 0 })} />
        </div>
      </div>

      {/* Quantidades */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Qtd. Inicial</Label>
          <Input type="number" min={0} value={form.quantidadeAtual}
            onChange={(e) => setForm({ ...form, quantidadeAtual: parseInt(e.target.value) || 0 })} />
        </div>
        <div>
          <Label>Qtd. Mínima</Label>
          <Input type="number" min={0} value={form.quantidadeMinima}
            onChange={(e) => setForm({ ...form, quantidadeMinima: parseInt(e.target.value) || 1 })} />
        </div>
      </div>

      {/* Modelos Compatíveis */}
      <div>
        <Label>Modelos Compatíveis</Label>
        <ModelMultiSelect
          models={models}
          selected={form.compatibleModelIds}
          onChange={(ids) => setForm({ ...form, compatibleModelIds: ids })}
        />
      </div>

      <Button
        className="w-full"
        style={{ background: "#1B4F8A" }}
        onClick={onSubmit}
        disabled={isPending || !form.nome.trim()}
      >
        {isPending ? "Salvando..." : submitLabel}
      </Button>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Estoque() {
  const { user } = useAuth();
  const isManager = user?.role === "admin";

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [movOpen, setMovOpen] = useState(false);
  const [selectedPecaId, setSelectedPecaId] = useState<number | null>(null);
  const [filterModelId, setFilterModelId] = useState<number | undefined>(undefined);
  const [form, setForm] = useState(BLANK_FORM);
  const [editForm, setEditForm] = useState(BLANK_FORM);
  const [movForm, setMovForm] = useState({ tipo: "entrada" as any, quantidade: 1, observacao: "" });

  const utils = trpc.useUtils();

  const { data: pecas = [], isLoading } = trpc.estoque.list.useQuery(
    filterModelId ? { compatibleModelId: filterModelId } : {}
  );
  const { data: models = [] } = trpc.estoque.listModels.useQuery();

  const create = trpc.estoque.create.useMutation({
    onSuccess: () => {
      toast.success("Peça cadastrada!");
      setOpen(false);
      setForm(BLANK_FORM);
      utils.estoque.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const update = trpc.estoque.update.useMutation({
    onSuccess: () => {
      toast.success("Peça atualizada!");
      setEditOpen(false);
      utils.estoque.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const movimentar = trpc.estoque.movimentar.useMutation({
    onSuccess: () => {
      toast.success("Movimentação registrada!");
      setMovOpen(false);
      utils.estoque.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  function startEdit(p: typeof pecas[number]) {
    setEditForm({
      nome: p.nome,
      categoria: p.categoria as any,
      precoCusto: p.precoCusto ? parseFloat(String(p.precoCusto)) : 0,
      precoVenda: parseFloat(String(p.precoVenda)),
      quantidadeAtual: p.quantidadeAtual,
      quantidadeMinima: p.quantidadeMinima,
      partNumber: p.partNumber ?? "",
      manufacturer: p.manufacturer ?? "",
      application: p.application ?? "",
      compatibleModelIds: p.compatibleModelIds ?? [],
    });
    setSelectedPecaId(p.id);
    setEditOpen(true);
  }

  const abaixoMinimo = pecas.filter((p) => p.quantidadeAtual < p.quantidadeMinima);

  return (
    <AppLayout title="Estoque">
      <div className="space-y-4">
        {/* Alerta de estoque baixo */}
        {abaixoMinimo.length > 0 && (
          <div className="rounded-xl border-2 border-orange-200 bg-orange-50 p-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <span className="text-sm text-orange-700 font-medium">
              {abaixoMinimo.length} peça(s) abaixo do estoque mínimo
            </span>
          </div>
        )}

        {/* Barra de ações */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtro por modelo */}
          {models.length > 0 && (
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Select
                value={filterModelId ? String(filterModelId) : "all"}
                onValueChange={(v) => setFilterModelId(v === "all" ? undefined : Number(v))}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Filtrar por modelo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os modelos</SelectItem>
                  {models.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.brand} {m.modelName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button style={{ background: "#1B4F8A" }}>
                <Plus className="w-4 h-4 mr-2" />Nova Peça
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Cadastrar Peça</DialogTitle></DialogHeader>
              <PecaForm
                form={form}
                setForm={setForm}
                models={models}
                isManager={isManager}
                onSubmit={() => create.mutate({
                  ...form,
                  precoCusto: form.precoCusto || undefined,
                  partNumber: form.partNumber || undefined,
                  manufacturer: form.manufacturer || undefined,
                  application: form.application || undefined,
                })}
                isPending={create.isPending}
                submitLabel="Cadastrar"
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de peças */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : pecas.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {filterModelId ? "Nenhuma peça compatível com este modelo." : "Nenhuma peça cadastrada."}
          </div>
        ) : (
          <div className="grid gap-3">
            {pecas.map((p) => {
              const baixo = p.quantidadeAtual < p.quantidadeMinima;
              const compatModels = models.filter((m) => p.compatibleModelIds?.includes(m.id));
              return (
                <Card key={p.id} className={baixo ? "border-orange-200" : ""}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${baixo ? "bg-orange-100" : "bg-primary/10"}`}>
                      <Package className={`w-5 h-5 ${baixo ? "text-orange-600" : "text-primary"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{p.nome}</p>
                        <Badge variant="outline" className="text-xs">{CAT_LABELS[p.categoria] ?? p.categoria}</Badge>
                        {baixo && <Badge className="text-xs bg-orange-100 text-orange-700">Estoque Baixo</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{p.codigo}</p>

                      {/* Part Number e Fabricante */}
                      {(p.partNumber || p.manufacturer) && (
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                          {p.partNumber && <span>PN: <span className="font-mono font-medium text-foreground">{p.partNumber}</span></span>}
                          {p.manufacturer && <span>Fab: <span className="font-medium text-foreground">{p.manufacturer}</span></span>}
                        </div>
                      )}

                      <div className="flex gap-4 mt-1 text-sm flex-wrap">
                        <span>Atual: <strong>{p.quantidadeAtual}</strong></span>
                        <span className="text-muted-foreground">Mín: {p.quantidadeMinima}</span>
                        <span>Venda: <strong>R$ {parseFloat(String(p.precoVenda)).toFixed(2)}</strong></span>
                        {isManager && p.precoCusto && (
                          <span className="text-muted-foreground">Custo: R$ {parseFloat(String(p.precoCusto)).toFixed(2)}</span>
                        )}
                      </div>

                      {/* Modelos compatíveis */}
                      {compatModels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {compatModels.map((m) => (
                            <Badge key={m.id} variant="secondary" className="text-xs">
                              {m.brand} {m.modelName}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Aplicação */}
                      {p.application && (
                        <p className="text-xs text-muted-foreground mt-1 italic line-clamp-1">{p.application}</p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => startEdit(p)}>Editar</Button>
                      <Button size="sm" variant="outline" onClick={() => { setSelectedPecaId(p.id); setMovOpen(true); }}>
                        Movimentar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Modal Editar */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Editar Peça</DialogTitle></DialogHeader>
            <PecaForm
              form={editForm}
              setForm={setEditForm}
              models={models}
              isManager={isManager}
              onSubmit={() => selectedPecaId && update.mutate({
                id: selectedPecaId,
                ...editForm,
                precoCusto: editForm.precoCusto || undefined,
                partNumber: editForm.partNumber || null,
                manufacturer: editForm.manufacturer || null,
                application: editForm.application || null,
              })}
              isPending={update.isPending}
              submitLabel="Salvar alterações"
            />
          </DialogContent>
        </Dialog>

        {/* Modal Movimentar */}
        <Dialog open={movOpen} onOpenChange={setMovOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Movimentar Estoque</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Tipo</Label>
                <Select value={movForm.tipo} onValueChange={(v) => setMovForm({ ...movForm, tipo: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                    <SelectItem value="ajuste">Ajuste de Inventário</SelectItem>
                    <SelectItem value="devolucao">Devolução</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantidade</Label>
                <Input type="number" min={1} value={movForm.quantidade}
                  onChange={(e) => setMovForm({ ...movForm, quantidade: parseInt(e.target.value) || 1 })} />
              </div>
              <div>
                <Label>Observação</Label>
                <Input value={movForm.observacao}
                  onChange={(e) => setMovForm({ ...movForm, observacao: e.target.value })} />
              </div>
              <Button className="w-full" style={{ background: "#1B4F8A" }}
                disabled={movimentar.isPending}
                onClick={() => selectedPecaId && movimentar.mutate({ pecaId: selectedPecaId, ...movForm })}>
                {movimentar.isPending ? "Salvando..." : "Confirmar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
