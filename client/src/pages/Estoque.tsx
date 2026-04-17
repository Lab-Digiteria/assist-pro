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
import { Plus, AlertTriangle, Package, X, Filter, Search, Loader2, Tag, RefreshCw, Barcode } from "lucide-react";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
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
  partNumber: "", manufacturer: "", application: "", sku: "",
  compatibleModelIds: [] as number[],
};

// ─── Multi-select de modelos ──────────────────────────────────────────────────
function ModelMultiSelect({
  models, selected, onChange,
}: {
  models: { id: number; brand: string; modelName: string; category: string }[];
  selected: number[];
  onChange: (ids: number[]) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () => models.filter((m) => !selected.includes(m.id) && `${m.brand} ${m.modelName}`.toLowerCase().includes(search.toLowerCase())),
    [models, selected, search]
  );
  const selectedModels = models.filter((m) => selected.includes(m.id));
  function toggle(id: number) {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
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
      <Input placeholder="Buscar modelo..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 text-sm" />
      {filtered.length > 0 && (
        <div className="border rounded-md max-h-36 overflow-y-auto">
          {filtered.map((m) => (
            <button key={m.id} type="button" onClick={() => toggle(m.id)}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors">
              <span className="font-medium">{m.brand}</span> <span>{m.modelName}</span>
              <span className="text-xs text-muted-foreground ml-1 capitalize">({m.category})</span>
            </button>
          ))}
        </div>
      )}
      {models.length === 0 && (
        <p className="text-xs text-muted-foreground">Nenhum modelo cadastrado. Acesse Configurações → Modelos de Equipamentos.</p>
      )}
    </div>
  );
}

// ─── Campo Part Number com busca Nexar ───────────────────────────────────────
function PartNumberField({
  value, onChange, onNexarResult,
}: {
  value: string;
  onChange: (v: string) => void;
  onNexarResult: (result: { description: string; manufacturer: string; specs: Array<{ name: string; value: string }>; referencePrice: number | null; referencePriceCurrency: string | null }) => void;
}) {
  const [searching, setSearching] = useState(false);
  const utils = trpc.useUtils();

  async function handleSearch() {
    const pn = value.trim();
    if (!pn) return;
    setSearching(true);
    try {
      const result = await utils.estoque.lookupPartNumber.fetch({ partNumber: pn });
      if (result.found) {
        onNexarResult({ description: result.description, manufacturer: result.manufacturer, specs: result.specs, referencePrice: result.referencePrice, referencePriceCurrency: result.referencePriceCurrency });
        toast.success("Dados preenchidos automaticamente via Nexar");
      } else {
        toast.info("Part number não encontrado na base — preencha manualmente");
      }
    } catch {
      toast.error("Erro ao consultar Nexar. Preencha manualmente.");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        <Input
          placeholder="Ex: GH82-12345A"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSearch(); } }}
          disabled={searching}
          className={`flex-1 transition-opacity ${searching ? "opacity-60" : ""}`}
        />
        <Button type="button" variant="outline" size="icon" className="flex-shrink-0"
          onClick={handleSearch} disabled={searching || !value.trim()} title="Buscar no Nexar">
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>
      {searching && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 animate-pulse">
          <Loader2 className="w-3 h-3 animate-spin" /> Consultando Nexar...
        </p>
      )}
    </div>
  );
}

// ─── Campo SKU com botão Gerar ────────────────────────────────────────────────
function SkuField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const generateSku = trpc.estoque.generateSku.useMutation({
    onSuccess: (data) => {
      onChange(data.sku);
      toast.success(`SKU gerado: ${data.sku}`);
    },
    onError: () => toast.error("Erro ao gerar SKU"),
  });

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        <Input
          placeholder="Ex: SKU-AB1234 (opcional)"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="flex-1 font-mono text-sm"
          maxLength={50}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="flex-shrink-0"
          onClick={() => generateSku.mutate()}
          disabled={generateSku.isPending}
          title="Gerar SKU automático"
        >
          {generateSku.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Código único para identificação rápida e leitura por scanner</p>
    </div>
  );
}

// ─── Formulário de peça ───────────────────────────────────────────────────────
function PecaForm({
  form, setForm, models, isManager, onSubmit, isPending, submitLabel,
}: {
  form: typeof BLANK_FORM;
  setForm: (f: typeof BLANK_FORM) => void;
  models: { id: number; brand: string; modelName: string; category: string }[];
  isManager: boolean;
  onSubmit: () => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const [nexarPriceSuggestion, setNexarPriceSuggestion] = useState<{ price: number; currency: string } | null>(null);

  function handleNexarResult(result: { description: string; manufacturer: string; specs: Array<{ name: string; value: string }>; referencePrice: number | null; referencePriceCurrency: string | null }) {
    const specsText = result.specs.length > 0 ? result.specs.map((s) => `${s.name}: ${s.value}`).join(" | ") : "";
    setForm({ ...form, nome: form.nome || result.description, manufacturer: result.manufacturer || form.manufacturer, application: specsText || form.application });
    if (result.referencePrice && result.referencePrice > 0) {
      setNexarPriceSuggestion({ price: result.referencePrice, currency: result.referencePriceCurrency || "USD" });
    }
  }

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

      {/* SKU */}
      <div>
        <Label className="flex items-center gap-1.5">
          <Barcode className="w-3.5 h-3.5" /> SKU
        </Label>
        <SkuField value={form.sku} onChange={(v) => setForm({ ...form, sku: v })} />
      </div>

      {/* Part Number */}
      <div>
        <Label>Part Number</Label>
        <PartNumberField value={form.partNumber} onChange={(v) => setForm({ ...form, partNumber: v })} onNexarResult={handleNexarResult} />
        <p className="text-xs text-muted-foreground mt-1">Pressione Enter ou clique na lupa para buscar via Nexar</p>
      </div>

      <div>
        <Label>Fabricante</Label>
        <Input placeholder="Ex: Samsung Parts, OEM, Texas Instruments" value={form.manufacturer}
          onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} />
      </div>
      <div>
        <Label>Aplicação / Observações</Label>
        <Textarea placeholder="Ex: Compatível com modelos S23 e S23+..." value={form.application}
          onChange={(e) => setForm({ ...form, application: e.target.value })} rows={2} className="resize-none" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {isManager && (
          <div>
            <Label>Preço de Custo (R$)</Label>
            <Input type="number" step="0.01" value={form.precoCusto}
              onChange={(e) => { setForm({ ...form, precoCusto: parseFloat(e.target.value) || 0 }); setNexarPriceSuggestion(null); }} />
            {nexarPriceSuggestion && (
              <div className="mt-1.5 flex items-center gap-2 p-2 rounded-md border border-blue-200 bg-blue-50">
                <Tag className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                <span className="text-xs text-blue-700 flex-1">
                  Nexar: <strong>{nexarPriceSuggestion.price.toFixed(4)} {nexarPriceSuggestion.currency}</strong>
                </span>
                <button type="button" className="text-xs font-medium text-blue-700 hover:text-blue-900 underline"
                  onClick={() => { setForm({ ...form, precoCusto: parseFloat(nexarPriceSuggestion.price.toFixed(2)) }); setNexarPriceSuggestion(null); }}>
                  Usar
                </button>
                <button type="button" className="text-xs text-blue-400 hover:text-blue-600" onClick={() => setNexarPriceSuggestion(null)}>
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}
        <div>
          <Label>Preço de Venda (R$)</Label>
          <Input type="number" step="0.01" value={form.precoVenda}
            onChange={(e) => setForm({ ...form, precoVenda: parseFloat(e.target.value) || 0 })} />
        </div>
      </div>

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

      <div>
        <Label>Modelos Compatíveis</Label>
        <ModelMultiSelect models={models} selected={form.compatibleModelIds}
          onChange={(ids) => setForm({ ...form, compatibleModelIds: ids })} />
      </div>

      <Button className="w-full" style={{ background: "#1B4F8A" }} onClick={onSubmit} disabled={isPending || !form.nome.trim()}>
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
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState(BLANK_FORM);
  const [editForm, setEditForm] = useState(BLANK_FORM);
  const [movForm, setMovForm] = useState({ tipo: "entrada" as any, quantidade: 1, observacao: "" });

  // Ref para o campo de busca — suporte a leitor de código de barras
  const searchRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  // Busca com debounce — dispara imediatamente ao receber Enter (leitor de barras)
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: pecas = [], isLoading } = trpc.estoque.list.useQuery(
    debouncedSearch
      ? { search: debouncedSearch }
      : filterModelId
      ? { compatibleModelId: filterModelId }
      : {}
  );
  const { data: models = [] } = trpc.estoque.listModels.useQuery();

  const create = trpc.estoque.create.useMutation({
    onSuccess: () => { toast.success("Peça cadastrada!"); setOpen(false); setForm(BLANK_FORM); utils.estoque.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const update = trpc.estoque.update.useMutation({
    onSuccess: () => { toast.success("Peça atualizada!"); setEditOpen(false); utils.estoque.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const movimentar = trpc.estoque.movimentar.useMutation({
    onSuccess: () => { toast.success("Movimentação registrada!"); setMovOpen(false); utils.estoque.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  function startEdit(p: typeof pecas[number]) {
    setEditForm({
      nome: p.nome, categoria: p.categoria as any,
      precoCusto: p.precoCusto ? parseFloat(String(p.precoCusto)) : 0,
      precoVenda: parseFloat(String(p.precoVenda)),
      quantidadeAtual: p.quantidadeAtual, quantidadeMinima: p.quantidadeMinima,
      partNumber: p.partNumber ?? "", manufacturer: p.manufacturer ?? "",
      application: p.application ?? "", sku: (p as any).sku ?? "",
      compatibleModelIds: p.compatibleModelIds ?? [],
    });
    setSelectedPecaId(p.id);
    setEditOpen(true);
  }

  // Suporte a leitor de código de barras: ao pressionar Enter no campo de busca, dispara imediatamente
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setDebouncedSearch(searchQuery);
    }
  }, [searchQuery]);

  const abaixoMinimo = pecas.filter((p) => p.quantidadeAtual < p.quantidadeMinima);
  // Destaque para match exato de SKU
  const exactSkuMatch = debouncedSearch ? pecas.find((p) => (p as any).sku === debouncedSearch) : null;

  return (
    <AppLayout title="Estoque">
      <div className="space-y-4">
        {/* Alerta de estoque baixo */}
        {abaixoMinimo.length > 0 && (
          <div className="rounded-xl border-2 border-orange-200 bg-orange-50 p-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <span className="text-sm text-orange-700 font-medium">
              {abaixoMinimo.length} peça{abaixoMinimo.length > 1 ? "s" : ""} abaixo do estoque mínimo:{" "}
              {abaixoMinimo.map((p) => p.nome).join(", ")}
            </span>
          </div>
        )}

        {/* Barra de ações */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Campo de busca com suporte a leitor de código de barras */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={searchRef}
              placeholder="Buscar por nome, SKU, Part Number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="pl-8 h-9 text-sm font-mono"
            />
            {searchQuery && (
              <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => { setSearchQuery(""); setDebouncedSearch(""); }}>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtro por modelo (só aparece quando não há busca ativa) */}
          {!debouncedSearch && models.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Select value={filterModelId ? String(filterModelId) : "all"}
                onValueChange={(v) => setFilterModelId(v === "all" ? undefined : Number(v))}>
                <SelectTrigger className="h-9 text-sm w-48">
                  <SelectValue placeholder="Filtrar por modelo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os modelos</SelectItem>
                  {models.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.brand} {m.modelName}</SelectItem>
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
              <PecaForm form={form} setForm={setForm} models={models} isManager={isManager}
                onSubmit={() => create.mutate({
                  ...form,
                  precoCusto: form.precoCusto || undefined,
                  partNumber: form.partNumber || undefined,
                  manufacturer: form.manufacturer || undefined,
                  application: form.application || undefined,
                  sku: form.sku || undefined,
                })}
                isPending={create.isPending} submitLabel="Cadastrar" />
            </DialogContent>
          </Dialog>
        </div>

        {/* Hint de leitor de código de barras */}
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Barcode className="w-3.5 h-3.5" />
          Campo de busca compatível com leitores de código de barras e QR Code — aponte o leitor e escaneie
        </p>

        {/* Match exato de SKU destacado */}
        {exactSkuMatch && (
          <div className="rounded-lg border-2 border-green-300 bg-green-50 p-3 flex items-center gap-2">
            <Barcode className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">
              SKU encontrado: <span className="font-mono">{(exactSkuMatch as any).sku}</span> — {exactSkuMatch.nome}
            </span>
          </div>
        )}

        {/* Lista de peças */}
        {isLoading ? (
          <div className="space-y-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3" style={{ borderBottom: "1px solid var(--surface-border)" }}>
                <div className="skeleton w-24 h-4 rounded" />
                <div className="skeleton flex-1 h-4 rounded" />
                <div className="skeleton w-16 h-4 rounded" />
                <div className="skeleton w-16 h-4 rounded" />
              </div>
            ))}
          </div>
        ) : pecas.length === 0 ? (
          <div className="empty-state">
            <Package size={36} style={{ color: "var(--text-muted)", marginBottom: 12 }} />
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              {debouncedSearch ? `Nenhuma peça para "${debouncedSearch}"` : filterModelId ? "Nenhuma peça compatível" : "Nenhuma peça cadastrada"}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Adicione peças usando o botão acima</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Peça / Código</th>
                <th>Categoria</th>
                <th>Qtd</th>
                <th>Venda</th>
                {isManager && <th>Custo</th>}
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pecas.map((p) => {
                const baixo = p.quantidadeAtual < p.quantidadeMinima;
                const isExactMatch = exactSkuMatch?.id === p.id;
                return (
                  <tr key={p.id} className={isExactMatch ? "ring-1 ring-inset" : ""}
                    style={isExactMatch ? { boxShadow: "inset 0 0 0 1px #22c55e" } : {}}>
                    <td>
                      <div className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{p.nome}</div>
                      <div className="flex gap-2 mt-0.5 flex-wrap">
                        <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{p.codigo}</span>
                        {(p as any).sku && <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>SKU: {(p as any).sku}</span>}
                        {p.partNumber && <span className="text-xs" style={{ color: "var(--text-muted)" }}>PN: {p.partNumber}</span>}
                      </div>
                    </td>
                    <td>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>
                        {CAT_LABELS[p.categoria] ?? p.categoria}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm" style={{ color: baixo ? "#fdba74" : "var(--text-primary)" }}>
                          {p.quantidadeAtual}
                        </span>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>/ {p.quantidadeMinima}</span>
                        {baixo && <span className="text-xs px-1 py-0.5 rounded" style={{ background: "rgba(196,115,58,0.15)", color: "#fdba74" }}>Baixo</span>}
                      </div>
                    </td>
                    <td>
                      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        R$ {parseFloat(String(p.precoVenda)).toFixed(2)}
                      </span>
                    </td>
                    {isManager && (
                      <td>
                        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                          {p.precoCusto ? `R$ ${parseFloat(String(p.precoCusto)).toFixed(2)}` : "—"}
                        </span>
                      </td>
                    )}
                    <td>
                      <div className="flex gap-1">
                        <button
                          className="px-2 py-1 rounded text-xs transition-colors"
                          style={{ background: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--surface-border)" }}
                          onClick={(e) => { e.stopPropagation(); startEdit(p); }}
                        >Editar</button>
                        <button
                          className="px-2 py-1 rounded text-xs transition-colors"
                          style={{ background: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--surface-border)" }}
                          onClick={(e) => { e.stopPropagation(); setSelectedPecaId(p.id); setMovOpen(true); }}
                        >Movimentar</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Modal Editar */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Editar Peça</DialogTitle></DialogHeader>
            <PecaForm form={editForm} setForm={setEditForm} models={models} isManager={isManager}
              onSubmit={() => selectedPecaId && update.mutate({
                id: selectedPecaId, ...editForm,
                precoCusto: editForm.precoCusto || undefined,
                partNumber: editForm.partNumber || null,
                manufacturer: editForm.manufacturer || null,
                application: editForm.application || null,
                sku: editForm.sku || null,
              })}
              isPending={update.isPending} submitLabel="Salvar alterações" />
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
                <Input value={movForm.observacao} onChange={(e) => setMovForm({ ...movForm, observacao: e.target.value })} />
              </div>
              <Button className="w-full" style={{ background: "#1B4F8A" }} disabled={movimentar.isPending}
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
