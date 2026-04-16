import AppLayout from "@/components/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Loader2,
  ExternalLink,
  FileText,
  Package,
  Factory,
  Tag,
  ShoppingCart,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Info,
  Plus,
} from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

// ─── Tipos locais ────────────────────────────────────────────────────────────
interface NexarSellerOffer {
  seller: string;
  url: string | null;
  inStock: boolean;
  moq: number | null;
  prices: Array<{ quantity: number; price: number; currency: string }>;
}

interface NexarResult {
  found: true;
  mpn: string;
  description: string;
  manufacturer: string;
  manufacturerUrl: string | null;
  category: string | null;
  subcategory: string | null;
  imageUrl: string | null;
  datasheetUrl: string | null;
  specs: Array<{ name: string; value: string }>;
  sellers: NexarSellerOffer[];
  referencePrice: number | null;
  referencePriceCurrency: string | null;
  sellersWithStock: number;
}

// ─── Sub-componente: Tabela de Specs ─────────────────────────────────────────
function SpecsTable({ specs }: { specs: Array<{ name: string; value: string }> }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? specs : specs.slice(0, 8);

  if (specs.length === 0) return null;

  return (
    <div>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left px-3 py-2 font-medium text-muted-foreground w-1/2">Parâmetro</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground w-1/2">Valor</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((s, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                <td className="px-3 py-1.5 text-muted-foreground">{s.name}</td>
                <td className="px-3 py-1.5 font-medium">{s.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {specs.length > 8 && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs text-primary hover:underline flex items-center gap-1"
        >
          <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`} />
          {expanded ? "Mostrar menos" : `Ver mais ${specs.length - 8} parâmetros`}
        </button>
      )}
    </div>
  );
}

// ─── Sub-componente: Tabela de Distribuidores ────────────────────────────────
function SellersTable({
  sellers,
}: {
  sellers: Array<{
    seller: string;
    url: string | null;
    inStock: boolean;
    moq: number | null;
    prices: Array<{ quantity: number; price: number; currency: string }>;
  }>;
}) {
  if (sellers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Nenhum distribuidor com preço disponível no momento.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm min-w-[500px]">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Distribuidor</th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Estoque</th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground">MOQ</th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Preço Unit. (1 pç)</th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Preço (10 pç)</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {sellers.map((s, i) => {
            const price1 = s.prices.find((p) => p.quantity <= 1) ?? s.prices[0];
            const price10 = [...s.prices].reverse().find((p) => p.quantity <= 10) ?? s.prices[s.prices.length - 1];
            return (
              <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                <td className="px-3 py-2 font-medium">{s.seller}</td>
                <td className="px-3 py-2">
                  {s.inStock ? (
                    <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />Em estoque
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-muted-foreground text-xs">
                      <XCircle className="w-3.5 h-3.5" />Indisponível
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {s.moq ? `${s.moq} pç` : "—"}
                </td>
                <td className="px-3 py-2 font-mono font-medium">
                  {price1 ? `${price1.price.toFixed(4)} ${price1.currency}` : "—"}
                </td>
                <td className="px-3 py-2 font-mono text-muted-foreground">
                  {price10 && price10 !== price1
                    ? `${price10.price.toFixed(4)} ${price10.currency}`
                    : "—"}
                </td>
                <td className="px-3 py-2">
                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 text-xs whitespace-nowrap"
                    >
                      Comprar <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Sub-componente: Resultado completo ──────────────────────────────────────
function PartResult({
  result,
  onAddToStock,
}: {
  result: NexarResult;
  onAddToStock: () => void;
}) {
  return (
    <div className="space-y-5">
      {/* Cabeçalho do componente */}
      <Card>
        <CardContent className="p-5">
          <div className="flex gap-5 flex-wrap">
            {/* Imagem */}
            {result.imageUrl && (
              <div className="w-28 h-28 rounded-lg border bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img
                  src={result.imageUrl}
                  alt={result.mpn}
                  className="max-w-full max-h-full object-contain p-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}

            {/* Informações principais */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-xl font-bold font-mono">{result.mpn}</h2>
                  <p className="text-muted-foreground mt-0.5">{result.description}</p>
                </div>
                <Button
                  style={{ background: "#1B4F8A" }}
                  onClick={onAddToStock}
                  className="flex-shrink-0"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar ao Estoque
                </Button>
              </div>

              <div className="flex flex-wrap gap-3 text-sm">
                {/* Fabricante */}
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Factory className="w-4 h-4 flex-shrink-0" />
                  {result.manufacturerUrl ? (
                    <a
                      href={result.manufacturerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground font-medium hover:underline flex items-center gap-1"
                    >
                      {result.manufacturer}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-foreground font-medium">{result.manufacturer}</span>
                  )}
                </div>

                {/* Categoria */}
                {result.category && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Package className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {result.category}
                      {result.subcategory && (
                        <span className="text-muted-foreground"> › {result.subcategory}</span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-1">
                {/* Preço de referência */}
                {result.referencePrice && (
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 border gap-1 font-mono">
                    <Tag className="w-3 h-3" />
                    A partir de {result.referencePrice.toFixed(4)} {result.referencePriceCurrency}
                  </Badge>
                )}

                {/* Distribuidores com estoque */}
                {result.sellersWithStock > 0 ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200 border gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {result.sellersWithStock} distribuidor{result.sellersWithStock > 1 ? "es" : ""} em estoque
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-600 border-gray-200 border gap-1">
                    <XCircle className="w-3 h-3" />
                    Sem estoque nos distribuidores
                  </Badge>
                )}

                {/* Datasheet */}
                {result.datasheetUrl && (
                  <a
                    href={result.datasheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200 border gap-1 cursor-pointer hover:bg-orange-200 transition-colors">
                      <FileText className="w-3 h-3" />
                      Datasheet
                      <ExternalLink className="w-3 h-3" />
                    </Badge>
                  </a>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Especificações técnicas */}
      {result.specs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="w-4 h-4 text-muted-foreground" />
              Especificações Técnicas
              <Badge variant="outline" className="text-xs font-normal ml-1">
                {result.specs.length} parâmetros
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <SpecsTable specs={result.specs} />
          </CardContent>
        </Card>
      )}

      {/* Distribuidores e preços */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
            Distribuidores e Preços
            <Badge variant="outline" className="text-xs font-normal ml-1">
              {result.sellers.length} oferta{result.sellers.length !== 1 ? "s" : ""}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <SellersTable sellers={result.sellers} />
          <p className="text-xs text-muted-foreground mt-3">
            Preços em USD. Consulte o distribuidor para cotação em BRL e disponibilidade atualizada.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function BuscaPeca() {
  const [query, setQuery] = useState("");
  const [searchedPn, setSearchedPn] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    data: result,
    isFetching,
    isError,
    error,
  } = trpc.estoque.lookupPartNumber.useQuery(
    { partNumber: searchedPn! },
    { enabled: !!searchedPn, retry: false }
  );

  function handleSearch() {
    const pn = query.trim();
    if (!pn) return;
    setSearchedPn(pn);
  }

  function handleAddToStock() {
    if (!result?.found) return;
    // Navega para o estoque com parâmetros de pré-preenchimento via sessionStorage
    sessionStorage.setItem(
      "nexar_prefill",
      JSON.stringify({
        partNumber: result.mpn,
        manufacturer: result.manufacturer,
        nome: result.description,
        application: result.specs.slice(0, 5).map((s) => `${s.name}: ${s.value}`).join(" | "),
        precoCusto: result.referencePrice ?? 0,
      })
    );
    navigate("/estoque");
    toast.success("Formulário de cadastro pré-preenchido com os dados da Nexar");
  }

  return (
    <AppLayout title="Busca de Componentes">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <div>
          <h1 className="text-2xl font-bold">Busca de Componentes</h1>
          <p className="text-muted-foreground mt-1">
            Pesquise qualquer Part Number (MPN) para obter especificações técnicas, preços e disponibilidade em tempo real via Nexar.
          </p>
        </div>

        {/* Campo de busca */}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Digite o Part Number (ex: LM358DR, GH82-12345A, STM32F103C8T6...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            className="text-base h-11"
          />
          <Button
            style={{ background: "#1B4F8A" }}
            className="h-11 px-6 flex-shrink-0"
            onClick={handleSearch}
            disabled={isFetching || !query.trim()}
          >
            {isFetching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Pesquisar
              </>
            )}
          </Button>
        </div>

        {/* Estado: carregando — skeleton */}
        {isFetching && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Consultando base Nexar para <strong className="text-foreground font-mono">{searchedPn}</strong>...</span>
            </div>
            {/* Card principal skeleton */}
            <Card>
              <CardContent className="p-5">
                <div className="flex gap-4">
                  <Skeleton className="w-20 h-20 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex gap-2 mt-2">
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-6 w-24 rounded-full" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Specs skeleton */}
            <Card>
              <CardContent className="p-5 space-y-2">
                <Skeleton className="h-4 w-32 mb-3" />
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                ))}
              </CardContent>
            </Card>
            {/* Distribuidores skeleton */}
            <Card>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-4 w-40 mb-3" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-16 rounded" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Estado: erro */}
        {isError && !isFetching && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="p-5 flex items-center gap-3">
              <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
              <div>
                <p className="font-medium text-destructive">Erro ao consultar Nexar</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {(error as any)?.message || "Verifique as credenciais e tente novamente."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estado: não encontrado */}
        {!isFetching && !isError && result && !result.found && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-5 flex items-center gap-3">
              <Info className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-orange-800">
                  Part Number <span className="font-mono">{searchedPn}</span> não encontrado
                </p>
                <p className="text-sm text-orange-700 mt-0.5">
                  Verifique a grafia do MPN ou tente uma variação sem sufixos de embalagem.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estado: resultado encontrado */}
        {!isFetching && !isError && result?.found && (
          <PartResult result={result as NexarResult} onAddToStock={handleAddToStock} />
        )}

        {/* Estado: inicial (sem busca) */}
        {!searchedPn && !isFetching && (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium text-lg">Pesquise um Part Number</p>
            <p className="text-sm mt-1 max-w-sm mx-auto">
              Digite o MPN do componente acima para consultar especificações, preços e disponibilidade em distribuidores globais.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-5">
              {["LM358DR", "STM32F103C8T6", "ATmega328P", "ESP32-WROOM-32"].map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => {
                    setQuery(example);
                    setSearchedPn(example);
                  }}
                  className="px-3 py-1.5 rounded-full border text-xs font-mono hover:bg-muted transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
