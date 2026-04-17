import { useState } from "react";
import { Link } from "wouter";
import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Star,
  MoreVertical,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Globe,
  Pencil,
  Trash2,
  PowerOff,
  Power,
  ExternalLink,
} from "lucide-react";

export default function Fornecedores() {
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("active");
  const [filterPreferred, setFilterPreferred] = useState(false);

  const { data: suppliers = [], isLoading, refetch } = trpc.suppliers.list.useQuery({
    search: search || undefined,
    isActive: filterActive === "all" ? undefined : filterActive === "active",
    isPreferred: filterPreferred || undefined,
  });

  const toggleActive = trpc.suppliers.toggleActive.useMutation({
    onSuccess: () => { refetch(); toast.success("Status atualizado"); },
    onError: (e) => toast.error(e.message),
  });

  const togglePreferred = trpc.suppliers.togglePreferred.useMutation({
    onSuccess: () => { refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteSupplier = trpc.suppliers.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Fornecedor removido"); },
    onError: (e) => toast.error(e.message),
  });

  const formatPhone = (p?: string | null) => p || "—";

  return (
    <AppLayout title="Fornecedores">
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fornecedores</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {suppliers.length} fornecedor{suppliers.length !== 1 ? "es" : ""} encontrado{suppliers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/fornecedores/novo">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Fornecedor
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CNPJ, e-mail, contato..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterActive} onValueChange={(v) => setFilterActive(v as any)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={filterPreferred ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterPreferred(!filterPreferred)}
          className="gap-2"
        >
          <Star className="w-4 h-4" />
          Preferenciais
        </Button>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : suppliers.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">Nenhum fornecedor encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? "Tente outros termos de busca." : "Cadastre seu primeiro fornecedor clicando em \"Novo Fornecedor\"."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {suppliers.map((s) => (
            <Card
              key={s.id}
              className={`transition-all hover:shadow-md ${!s.isActive ? "opacity-60" : ""} ${s.isPreferred ? "border-yellow-400/50 bg-yellow-50/5" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Info principal */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${s.isPreferred ? "bg-yellow-100 text-yellow-700" : "bg-muted text-muted-foreground"}`}>
                      {s.companyType === "juridica" ? <Building2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/fornecedores/${s.id}`}>
                          <span className="font-semibold hover:underline cursor-pointer truncate">
                            {s.tradeName || s.corporateName}
                          </span>
                        </Link>
                        {s.isPreferred && (
                          <Badge variant="outline" className="border-yellow-400 text-yellow-600 text-xs gap-1">
                            <Star className="w-3 h-3 fill-yellow-400" />
                            Preferencial
                          </Badge>
                        )}
                        {!s.isActive && (
                          <Badge variant="secondary" className="text-xs">Inativo</Badge>
                        )}
                      </div>
                      {s.tradeName && (
                        <p className="text-xs text-muted-foreground truncate">{s.corporateName}</p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                        {s.cnpj && <span>{s.cnpj}</span>}
                        {s.emailPrimary && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />{s.emailPrimary}
                          </span>
                        )}
                        {(s.phoneMobile || s.phoneLandline) && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />{s.phoneMobile || s.phoneLandline}
                          </span>
                        )}
                        {s.city && s.state && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{s.city} — {s.state}
                          </span>
                        )}
                        {s.website && (
                          <a href={s.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                            <Globe className="w-3 h-3" />{s.website.replace(/^https?:\/\//, "")}
                          </a>
                        )}
                      </div>
                      {/* Categorias */}
                      {Array.isArray(s.supplierCategory) && s.supplierCategory.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(s.supplierCategory as string[]).slice(0, 4).map((cat) => (
                            <Badge key={cat} variant="secondary" className="text-xs">{cat}</Badge>
                          ))}
                          {(s.supplierCategory as string[]).length > 4 && (
                            <Badge variant="secondary" className="text-xs">+{(s.supplierCategory as string[]).length - 4}</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rating + Ações */}
                  <div className="flex items-center gap-2 shrink-0">
                    {s.rating && (
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${star <= s.rating! ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
                          />
                        ))}
                      </div>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/fornecedores/${s.id}`}>
                            <ExternalLink className="w-4 h-4 mr-2" />Ver detalhes
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/fornecedores/${s.id}/editar`}>
                            <Pencil className="w-4 h-4 mr-2" />Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => togglePreferred.mutate({ id: s.id, isPreferred: !s.isPreferred })}
                        >
                          <Star className="w-4 h-4 mr-2" />
                          {s.isPreferred ? "Remover preferencial" : "Marcar preferencial"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => toggleActive.mutate({ id: s.id, isActive: !s.isActive })}
                        >
                          {s.isActive ? <PowerOff className="w-4 h-4 mr-2" /> : <Power className="w-4 h-4 mr-2" />}
                          {s.isActive ? "Desativar" : "Ativar"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            if (confirm(`Remover "${s.tradeName || s.corporateName}"?`)) {
                              deleteSupplier.mutate({ id: s.id });
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
    </AppLayout>
  );
}
