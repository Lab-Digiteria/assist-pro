import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, Pencil, Trash2, Cpu } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "smartphone", label: "Smartphone" },
  { value: "notebook", label: "Notebook" },
  { value: "tablet", label: "Tablet" },
  { value: "videogame", label: "Videogame" },
  { value: "desktop", label: "Desktop" },
  { value: "impressora", label: "Impressora" },
  { value: "tv", label: "TV" },
  { value: "outro", label: "Outro" },
] as const;

type Category = typeof CATEGORIES[number]["value"];

const CATEGORY_COLORS: Record<Category, string> = {
  smartphone: "bg-blue-100 text-blue-800",
  notebook: "bg-purple-100 text-purple-800",
  tablet: "bg-indigo-100 text-indigo-800",
  videogame: "bg-green-100 text-green-800",
  desktop: "bg-gray-100 text-gray-800",
  impressora: "bg-yellow-100 text-yellow-800",
  tv: "bg-orange-100 text-orange-800",
  outro: "bg-slate-100 text-slate-800",
};

const BLANK_FORM = { brand: "", modelName: "", category: "smartphone" as Category };

// ─── Formulário definido FORA do componente pai para evitar re-mount ─────────
function ModeloForm({
  values,
  onChange,
  onSubmit,
  isPending,
  submitLabel,
  onCancel,
}: {
  values: typeof BLANK_FORM;
  onChange: (v: typeof BLANK_FORM) => void;
  onSubmit: () => void;
  isPending: boolean;
  submitLabel: string;
  onCancel?: () => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Marca *</Label>
        <Input
          value={values.brand}
          onChange={(e) => onChange({ ...values, brand: e.target.value })}
          placeholder="Ex: Samsung, Apple, Motorola..."
        />
      </div>
      <div>
        <Label>Nome do Modelo *</Label>
        <Input
          value={values.modelName}
          onChange={(e) => onChange({ ...values, modelName: e.target.value })}
          placeholder="Ex: Galaxy S23, iPhone 14 Pro..."
        />
      </div>
      <div>
        <Label>Categoria *</Label>
        <Select
          value={values.category}
          onValueChange={(v) => onChange({ ...values, category: v as Category })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DialogFooter className="gap-2 pt-2">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} type="button">
            Cancelar
          </Button>
        )}
        <Button
          style={{ background: "#1B4F8A" }}
          onClick={onSubmit}
          disabled={isPending || !values.brand.trim() || !values.modelName.trim()}
          type="button"
        >
          {isPending ? "Salvando..." : submitLabel}
        </Button>
      </DialogFooter>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ModelosEquipamentos() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [createForm, setCreateForm] = useState(BLANK_FORM);
  const [editForm, setEditForm] = useState(BLANK_FORM);

  const utils = trpc.useUtils();

  const { data: modelos = [], isLoading } = trpc.equipmentModels.list.useQuery({ search });

  const create = trpc.equipmentModels.create.useMutation({
    onSuccess: () => {
      toast.success("Modelo cadastrado!");
      setCreateOpen(false);
      setCreateForm(BLANK_FORM);
      utils.equipmentModels.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const update = trpc.equipmentModels.update.useMutation({
    onSuccess: () => {
      toast.success("Modelo atualizado!");
      setEditId(null);
      utils.equipmentModels.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const remove = trpc.equipmentModels.delete.useMutation({
    onSuccess: () => {
      toast.success("Modelo excluído!");
      utils.equipmentModels.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  function startEdit(m: typeof modelos[number]) {
    setEditForm({ brand: m.brand, modelName: m.modelName, category: m.category as Category });
    setEditId(m.id);
  }

  // Group by category for display
  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    items: modelos.filter((m) => m.category === cat.value),
  })).filter((g) => g.items.length > 0 || search === "");

  const totalModelos = modelos.length;

  return (
    <AppLayout title="Modelos de Equipamentos">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por marca ou modelo..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button style={{ background: "#1B4F8A" }}>
                <Plus className="w-4 h-4 mr-2" />Novo Modelo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Novo Modelo de Equipamento</DialogTitle>
              </DialogHeader>
              <ModeloForm
                values={createForm}
                onChange={setCreateForm}
                onSubmit={() => create.mutate(createForm)}
                isPending={create.isPending}
                submitLabel="Cadastrar"
                onCancel={() => setCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Cpu className="w-4 h-4" />
          <span>{totalModelos} modelo{totalModelos !== 1 ? "s" : ""} cadastrado{totalModelos !== 1 ? "s" : ""}</span>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : modelos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Cpu className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground font-medium">Nenhum modelo cadastrado</p>
              <p className="text-sm text-muted-foreground mt-1">
                Cadastre os modelos de equipamentos que você atende para facilitar a busca de peças compatíveis.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {CATEGORIES.map((cat) => {
              const items = modelos.filter((m) => m.category === cat.value);
              if (items.length === 0) return null;
              return (
                <div key={cat.value}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`text-xs ${CATEGORY_COLORS[cat.value]}`}>{cat.label}</Badge>
                    <span className="text-xs text-muted-foreground">{items.length} modelo{items.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="grid gap-2">
                    {items.map((m) => (
                      <Card key={m.id} className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-3 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm">{m.brand} {m.modelName}</p>
                            <p className="text-xs text-muted-foreground capitalize">{cat.label}</p>
                          </div>
                          <div className="flex gap-1">
                            {/* Edit */}
                            <Dialog
                              open={editId === m.id}
                              onOpenChange={(o) => { if (!o) setEditId(null); }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => startEdit(m)}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Editar Modelo</DialogTitle>
                                </DialogHeader>
                                <ModeloForm
                                  values={editForm}
                                  onChange={setEditForm}
                                  onSubmit={() => update.mutate({ id: m.id, ...editForm })}
                                  isPending={update.isPending}
                                  submitLabel="Salvar alterações"
                                  onCancel={() => setEditId(null)}
                                />
                              </DialogContent>
                            </Dialog>

                            {/* Delete */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir modelo?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    O modelo <strong>{m.brand} {m.modelName}</strong> será removido permanentemente. Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => remove.mutate({ id: m.id })}
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
