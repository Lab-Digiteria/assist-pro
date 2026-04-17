import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Star,
  Loader2,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  ShoppingCart,
  Package,
  X,
  Plus,
  Search,
} from "lucide-react";

// ─── Constantes ───────────────────────────────────────────────────────────────
const SUPPLIER_CATEGORIES = [
  "Componentes Eletrônicos",
  "Ferramentas",
  "Equipamentos de Teste",
  "Peças de Celular",
  "Peças de Notebook",
  "Peças de TV",
  "Cabos e Conectores",
  "Baterias",
  "Displays",
  "Acessórios",
  "Embalagens",
  "Consumíveis",
];

const BRANDS_PRESETS = [
  "Samsung", "Apple", "Motorola", "Xiaomi", "LG", "Sony",
  "Philips", "Positivo", "Multilaser", "Intelbras",
];

const PAYMENT_METHODS: { label: string; value: "pix" | "boleto" | "transferencia" | "cartao" }[] = [
  { label: "PIX", value: "pix" },
  { label: "Boleto", value: "boleto" },
  { label: "Transferência Bancária", value: "transferencia" },
  { label: "Cartão", value: "cartao" },
];

const PAYMENT_TERMS_OPTIONS = [
  "À vista", "7 dias", "14 dias", "21 dias", "28 dias", "30 dias", "45 dias", "60 dias",
];

const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
  "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

// ─── Tipo do formulário ───────────────────────────────────────────────────────
type FormData = {
  companyType: "juridica" | "fisica";
  corporateName: string;
  tradeName: string;
  cnpj: string;
  cpf: string;
  stateRegistration: string;
  municipalRegistration: string;
  cnae: string;
  foundingDate: string;
  isActive: boolean;
  isPreferred: boolean;
  // Contato
  emailPrimary: string;
  emailSecondary: string;
  phoneLandline: string;
  phoneMobile: string;
  phoneWhatsapp: string;
  whatsappSameAsMobile: boolean;
  website: string;
  contactName: string;
  contactRole: string;
  // Endereço
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  // Comercial
  supplierCategory: string[];
  paymentTerms: string;
  paymentMethodPreferred: "pix" | "boleto" | "transferencia" | "cartao" | "";
  minimumOrder: string;
  averageDeliveryDays: string;
  discountPercentage: string;
  creditLimit: string;
  observationsCommercial: string;
  // Produtos
  brandsSupplied: string[];
  productLines: string[];
  catalogUrl: string;
  // Avaliação
  rating: number;
  ratingNotes: string;
  firstPurchaseDate: string;
};

const emptyForm: FormData = {
  companyType: "juridica",
  corporateName: "",
  tradeName: "",
  cnpj: "",
  cpf: "",
  stateRegistration: "",
  municipalRegistration: "",
  cnae: "",
  foundingDate: "",
  isActive: true,
  isPreferred: false,
  emailPrimary: "",
  emailSecondary: "",
  phoneLandline: "",
  phoneMobile: "",
  phoneWhatsapp: "",
  whatsappSameAsMobile: false,
  website: "",
  contactName: "",
  contactRole: "",
  zipCode: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  country: "Brasil",
  supplierCategory: [],
  paymentTerms: "",
  paymentMethodPreferred: "" as "pix" | "boleto" | "transferencia" | "cartao" | "",
  minimumOrder: "",
  averageDeliveryDays: "",
  discountPercentage: "",
  creditLimit: "",
  observationsCommercial: "",
  brandsSupplied: [],
  productLines: [],
  catalogUrl: "",
  rating: 0,
  ratingNotes: "",
  firstPurchaseDate: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function maskCNPJ(v: string) {
  return v.replace(/\D/g, "").slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}
function maskCPF(v: string) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}
function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
}
function maskCEP(v: string) {
  return v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
}

// ─── Componente MultiSelect ───────────────────────────────────────────────────
function MultiSelect({
  label, options, value, onChange, allowCustom = false,
}: {
  label: string; options: string[]; value: string[]; onChange: (v: string[]) => void; allowCustom?: boolean;
}) {
  const [custom, setCustom] = useState("");
  const toggle = (opt: string) => {
    onChange(value.includes(opt) ? value.filter((x) => x !== opt) : [...value, opt]);
  };
  const addCustom = () => {
    const trimmed = custom.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setCustom("");
    }
  };
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-3 py-1 rounded-full text-xs border transition-colors ${value.includes(opt) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}
          >
            {opt}
          </button>
        ))}
      </div>
      {allowCustom && (
        <div className="flex gap-2">
          <Input
            placeholder="Adicionar marca..."
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
            className="h-8 text-sm"
          />
          <Button type="button" variant="outline" size="sm" onClick={addCustom}>
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      )}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {value.map((v) => (
            <Badge key={v} variant="secondary" className="gap-1 text-xs">
              {v}
              <button type="button" onClick={() => onChange(value.filter((x) => x !== v))}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Componente StarRating ────────────────────────────────────────────────────
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star === value ? 0 : star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="focus:outline-none"
        >
          <Star
            className={`w-7 h-7 transition-colors ${star <= (hover || value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30 hover:text-yellow-300"}`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="text-sm text-muted-foreground self-center ml-2">{value}/5</span>
      )}
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function FornecedorForm() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const isEdit = !!id;
  const [form, setForm] = useState<FormData>(emptyForm);
  const [cepLoading, setCepLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("identificacao");

  // Carregar dados para edição
  const { data: supplier, isLoading: loadingSupplier } = trpc.suppliers.getById.useQuery(
    { id: Number(id) },
    { enabled: isEdit }
  );

  useEffect(() => {
    if (supplier) {
      setForm({
        companyType: (supplier.companyType as "juridica" | "fisica") || "juridica",
        corporateName: supplier.corporateName || "",
        tradeName: supplier.tradeName || "",
        cnpj: supplier.cnpj || "",
        cpf: supplier.cpf || "",
        stateRegistration: supplier.stateRegistration || "",
        municipalRegistration: supplier.municipalRegistration || "",
        cnae: supplier.cnae || "",
        foundingDate: supplier.foundingDate ? new Date(supplier.foundingDate).toISOString().split("T")[0] : "",
        isActive: supplier.isActive ?? true,
        isPreferred: supplier.isPreferred ?? false,
        emailPrimary: supplier.emailPrimary || "",
        emailSecondary: supplier.emailSecondary || "",
        phoneLandline: supplier.phoneLandline || "",
        phoneMobile: supplier.phoneMobile || "",
        phoneWhatsapp: supplier.phoneWhatsapp || "",
        whatsappSameAsMobile: false,
        website: supplier.website || "",
        contactName: supplier.contactName || "",
        contactRole: supplier.contactRole || "",
        zipCode: supplier.zipCode || "",
        street: supplier.street || "",
        number: supplier.number || "",
        complement: supplier.complement || "",
        neighborhood: supplier.neighborhood || "",
        city: supplier.city || "",
        state: supplier.state || "",
        country: supplier.country || "Brasil",
        supplierCategory: Array.isArray(supplier.supplierCategory) ? supplier.supplierCategory as string[] : [],
        paymentTerms: supplier.paymentTerms || "",
        paymentMethodPreferred: (supplier.paymentMethodPreferred as "pix" | "boleto" | "transferencia" | "cartao" | "") || "",
        minimumOrder: supplier.minimumOrder?.toString() || "",
        averageDeliveryDays: supplier.averageDeliveryDays?.toString() || "",
        discountPercentage: supplier.discountPercentage?.toString() || "",
        creditLimit: supplier.creditLimit?.toString() || "",
        observationsCommercial: supplier.observationsCommercial || "",
        brandsSupplied: Array.isArray(supplier.brandsSupplied) ? supplier.brandsSupplied as string[] : [],
        productLines: Array.isArray(supplier.productLines) ? supplier.productLines as string[] : (supplier.productLines ? [supplier.productLines as string] : []),
        catalogUrl: supplier.catalogUrl || "",
        rating: supplier.rating || 0,
        ratingNotes: supplier.ratingNotes || "",
        firstPurchaseDate: supplier.firstPurchaseDate ? new Date(supplier.firstPurchaseDate).toISOString().split("T")[0] : "",
      });
    }
  }, [supplier]);

  const set = (field: keyof FormData, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // ViaCEP
  const lookupCEP = async (cep: string) => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm((prev) => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
      } else {
        toast.error("CEP não encontrado");
      }
    } catch {
      toast.error("Erro ao consultar CEP");
    } finally {
      setCepLoading(false);
    }
  };

  // Mutations
  const createMutation = trpc.suppliers.create.useMutation({
    onSuccess: (data) => {
      toast.success("Fornecedor cadastrado com sucesso!");
      navigate(`/fornecedores/${data.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.suppliers.update.useMutation({
    onSuccess: () => {
      toast.success("Fornecedor atualizado!");
      navigate(`/fornecedores/${id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.corporateName.trim()) {
      toast.error("Razão Social é obrigatória");
      setActiveTab("identificacao");
      return;
    }
    const payload = {
      companyType: form.companyType,
      corporateName: form.corporateName.trim(),
      tradeName: form.tradeName.trim() || undefined,
      cnpj: form.cnpj || undefined,
      cpf: form.cpf || undefined,
      stateRegistration: form.stateRegistration || undefined,
      municipalRegistration: form.municipalRegistration || undefined,
      cnae: form.cnae || undefined,
      foundingDate: form.foundingDate || undefined,
      isActive: form.isActive,
      isPreferred: form.isPreferred,
      emailPrimary: form.emailPrimary || undefined,
      emailSecondary: form.emailSecondary || undefined,
      phoneLandline: form.phoneLandline || undefined,
      phoneMobile: form.phoneMobile || undefined,
      phoneWhatsapp: form.phoneWhatsapp || undefined,
      website: form.website || undefined,
      contactName: form.contactName || undefined,
      contactRole: form.contactRole || undefined,
      zipCode: form.zipCode || undefined,
      street: form.street || undefined,
      number: form.number || undefined,
      complement: form.complement || undefined,
      neighborhood: form.neighborhood || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      country: form.country || undefined,
      supplierCategory: form.supplierCategory.length > 0 ? form.supplierCategory : undefined,
      paymentTerms: form.paymentTerms || undefined,
      paymentMethodPreferred: form.paymentMethodPreferred || undefined as any,
      minimumOrder: form.minimumOrder ? parseFloat(form.minimumOrder) : undefined,
      averageDeliveryDays: form.averageDeliveryDays ? parseInt(form.averageDeliveryDays) : undefined,
      discountPercentage: form.discountPercentage ? parseFloat(form.discountPercentage) : undefined,
      creditLimit: form.creditLimit ? parseFloat(form.creditLimit) : undefined,
      observationsCommercial: form.observationsCommercial || undefined,
      brandsSupplied: form.brandsSupplied.length > 0 ? form.brandsSupplied : undefined,
      productLines: form.productLines.length > 0 ? form.productLines : undefined,
      catalogUrl: form.catalogUrl || undefined,
      rating: form.rating || undefined,
      ratingNotes: form.ratingNotes || undefined,
      firstPurchaseDate: form.firstPurchaseDate || undefined,
    };

    if (isEdit) {
      updateMutation.mutate({ id: Number(id), ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isEdit && loadingSupplier) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(isEdit ? `/fornecedores/${id}` : "/fornecedores")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{isEdit ? "Editar Fornecedor" : "Novo Fornecedor"}</h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? supplier?.tradeName || supplier?.corporateName : "Preencha os dados do fornecedor"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="identificacao" className="gap-2">
              <Building2 className="w-4 h-4" />Identificação
            </TabsTrigger>
            <TabsTrigger value="contato" className="gap-2">
              <Phone className="w-4 h-4" />Contato
            </TabsTrigger>
            <TabsTrigger value="endereco" className="gap-2">
              <MapPin className="w-4 h-4" />Endereço
            </TabsTrigger>
            <TabsTrigger value="comercial" className="gap-2">
              <Briefcase className="w-4 h-4" />Comercial
            </TabsTrigger>
            <TabsTrigger value="produtos" className="gap-2">
              <Package className="w-4 h-4" />Produtos
            </TabsTrigger>
            <TabsTrigger value="avaliacao" className="gap-2">
              <Star className="w-4 h-4" />Avaliação
            </TabsTrigger>
          </TabsList>

          {/* ── Identificação ── */}
          <TabsContent value="identificacao">
            <Card>
              <CardHeader><CardTitle className="text-base">Identificação</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {/* Tipo PJ/PF */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => set("companyType", "juridica")}
                    className={`flex-1 py-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${form.companyType === "juridica" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}
                  >
                    <Building2 className="w-4 h-4" />Pessoa Jurídica
                  </button>
                  <button
                    type="button"
                    onClick={() => set("companyType", "fisica")}
                    className={`flex-1 py-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-colors ${form.companyType === "fisica" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}
                  >
                    <User className="w-4 h-4" />Pessoa Física
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-1">
                    <Label htmlFor="corporateName">
                      {form.companyType === "juridica" ? "Razão Social" : "Nome Completo"} *
                    </Label>
                    <Input
                      id="corporateName"
                      value={form.corporateName}
                      onChange={(e) => set("corporateName", e.target.value)}
                      placeholder={form.companyType === "juridica" ? "Razão Social da empresa" : "Nome completo"}
                      required
                    />
                  </div>
                  {form.companyType === "juridica" && (
                    <div className="space-y-1">
                      <Label htmlFor="tradeName">Nome Fantasia</Label>
                      <Input
                        id="tradeName"
                        value={form.tradeName}
                        onChange={(e) => set("tradeName", e.target.value)}
                        placeholder="Nome fantasia"
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label htmlFor="doc">{form.companyType === "juridica" ? "CNPJ" : "CPF"}</Label>
                    <Input
                      id="doc"
                      value={form.companyType === "juridica" ? form.cnpj : form.cpf}
                      onChange={(e) => {
                        const masked = form.companyType === "juridica" ? maskCNPJ(e.target.value) : maskCPF(e.target.value);
                        set(form.companyType === "juridica" ? "cnpj" : "cpf", masked);
                      }}
                      placeholder={form.companyType === "juridica" ? "00.000.000/0000-00" : "000.000.000-00"}
                    />
                  </div>
                  {form.companyType === "juridica" && (
                    <>
                      <div className="space-y-1">
                        <Label htmlFor="stateRegistration">Inscrição Estadual</Label>
                        <Input
                          id="stateRegistration"
                          value={form.stateRegistration}
                          onChange={(e) => set("stateRegistration", e.target.value)}
                          placeholder="Inscrição Estadual"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="municipalRegistration">Inscrição Municipal</Label>
                        <Input
                          id="municipalRegistration"
                          value={form.municipalRegistration}
                          onChange={(e) => set("municipalRegistration", e.target.value)}
                          placeholder="Inscrição Municipal"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="cnae">CNAE</Label>
                        <Input
                          id="cnae"
                          value={form.cnae}
                          onChange={(e) => set("cnae", e.target.value)}
                          placeholder="0000-0/00"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="foundingDate">Data de Fundação</Label>
                        <Input
                          id="foundingDate"
                          type="date"
                          value={form.foundingDate}
                          onChange={(e) => set("foundingDate", e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-6 pt-2">
                  <div className="flex items-center gap-3">
                    <Switch
                      id="isActive"
                      checked={form.isActive}
                      onCheckedChange={(v) => set("isActive", v)}
                    />
                    <Label htmlFor="isActive">Fornecedor Ativo</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="isPreferred"
                      checked={form.isPreferred}
                      onCheckedChange={(v) => set("isPreferred", v)}
                    />
                    <Label htmlFor="isPreferred" className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />Preferencial
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Contato ── */}
          <TabsContent value="contato">
            <Card>
              <CardHeader><CardTitle className="text-base">Informações de Contato</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="emailPrimary">E-mail Principal</Label>
                    <Input
                      id="emailPrimary"
                      type="email"
                      value={form.emailPrimary}
                      onChange={(e) => set("emailPrimary", e.target.value)}
                      placeholder="contato@empresa.com.br"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="emailSecondary">E-mail Secundário</Label>
                    <Input
                      id="emailSecondary"
                      type="email"
                      value={form.emailSecondary}
                      onChange={(e) => set("emailSecondary", e.target.value)}
                      placeholder="financeiro@empresa.com.br"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="phoneLandline">Telefone Fixo</Label>
                    <Input
                      id="phoneLandline"
                      value={form.phoneLandline}
                      onChange={(e) => set("phoneLandline", maskPhone(e.target.value))}
                      placeholder="(00) 0000-0000"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="phoneMobile">Celular</Label>
                    <Input
                      id="phoneMobile"
                      value={form.phoneMobile}
                      onChange={(e) => {
                        const v = maskPhone(e.target.value);
                        set("phoneMobile", v);
                        if (form.whatsappSameAsMobile) set("phoneWhatsapp", v);
                      }}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="phoneWhatsapp">WhatsApp</Label>
                    <div className="flex gap-2">
                      <Input
                        id="phoneWhatsapp"
                        value={form.whatsappSameAsMobile ? form.phoneMobile : form.phoneWhatsapp}
                        onChange={(e) => set("phoneWhatsapp", maskPhone(e.target.value))}
                        disabled={form.whatsappSameAsMobile}
                        placeholder="(00) 00000-0000"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = !form.whatsappSameAsMobile;
                          set("whatsappSameAsMobile", next);
                          if (next) set("phoneWhatsapp", form.phoneMobile);
                        }}
                        className={`px-3 py-2 rounded-md border text-xs whitespace-nowrap transition-colors ${form.whatsappSameAsMobile ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}
                      >
                        = Celular
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={form.website}
                      onChange={(e) => set("website", e.target.value)}
                      placeholder="https://www.empresa.com.br"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="contactName">Nome do Contato</Label>
                    <Input
                      id="contactName"
                      value={form.contactName}
                      onChange={(e) => set("contactName", e.target.value)}
                      placeholder="Nome do responsável"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="contactRole">Cargo do Contato</Label>
                    <Input
                      id="contactRole"
                      value={form.contactRole}
                      onChange={(e) => set("contactRole", e.target.value)}
                      placeholder="Gerente Comercial"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Endereço ── */}
          <TabsContent value="endereco">
            <Card>
              <CardHeader><CardTitle className="text-base">Endereço</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="zipCode">CEP</Label>
                    <div className="relative">
                      <Input
                        id="zipCode"
                        value={form.zipCode}
                        onChange={(e) => {
                          const v = maskCEP(e.target.value);
                          set("zipCode", v);
                          if (v.replace(/\D/g, "").length === 8) lookupCEP(v);
                        }}
                        placeholder="00000-000"
                        className="pr-9"
                      />
                      {cepLoading && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                      )}
                      {!cepLoading && (
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <Label htmlFor="street">Logradouro</Label>
                    <Input
                      id="street"
                      value={form.street}
                      onChange={(e) => set("street", e.target.value)}
                      placeholder="Rua, Avenida, etc."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="number">Número</Label>
                    <Input
                      id="number"
                      value={form.number}
                      onChange={(e) => set("number", e.target.value)}
                      placeholder="123"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      value={form.complement}
                      onChange={(e) => set("complement", e.target.value)}
                      placeholder="Sala, Andar, etc."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      value={form.neighborhood}
                      onChange={(e) => set("neighborhood", e.target.value)}
                      placeholder="Bairro"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={form.city}
                      onChange={(e) => set("city", e.target.value)}
                      placeholder="Cidade"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="state">Estado</Label>
                    <Select value={form.state} onValueChange={(v) => set("state", v)}>
                      <SelectTrigger id="state">
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {ESTADOS_BR.map((uf) => (
                          <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="country">País</Label>
                    <Input
                      id="country"
                      value={form.country}
                      onChange={(e) => set("country", e.target.value)}
                      placeholder="Brasil"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Comercial ── */}
          <TabsContent value="comercial">
            <Card>
              <CardHeader><CardTitle className="text-base">Dados Comerciais</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <MultiSelect
                  label="Categorias de Fornecimento"
                  options={SUPPLIER_CATEGORIES}
                  value={form.supplierCategory}
                  onChange={(v) => set("supplierCategory", v)}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="paymentTerms">Prazo de Pagamento</Label>
                    <Select value={form.paymentTerms} onValueChange={(v) => set("paymentTerms", v)}>
                      <SelectTrigger id="paymentTerms">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_TERMS_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="paymentMethodPreferred">Forma de Pagamento Preferida</Label>
                    <Select value={form.paymentMethodPreferred} onValueChange={(v) => set("paymentMethodPreferred", v as any)}>
                      <SelectTrigger id="paymentMethodPreferred">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="minimumOrder">Pedido Mínimo (R$)</Label>
                    <Input
                      id="minimumOrder"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.minimumOrder}
                      onChange={(e) => set("minimumOrder", e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="averageDeliveryDays">Prazo Médio de Entrega (dias)</Label>
                    <Input
                      id="averageDeliveryDays"
                      type="number"
                      min="0"
                      value={form.averageDeliveryDays}
                      onChange={(e) => set("averageDeliveryDays", e.target.value)}
                      placeholder="7"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="discountPercentage">Desconto (%)</Label>
                    <Input
                      id="discountPercentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={form.discountPercentage}
                      onChange={(e) => set("discountPercentage", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="creditLimit">Limite de Crédito (R$)</Label>
                    <Input
                      id="creditLimit"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.creditLimit}
                      onChange={(e) => set("creditLimit", e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="observationsCommercial">Observações Comerciais</Label>
                  <Textarea
                    id="observationsCommercial"
                    value={form.observationsCommercial}
                    onChange={(e) => set("observationsCommercial", e.target.value)}
                    placeholder="Condições especiais, acordos, etc."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Produtos ── */}
          <TabsContent value="produtos">
            <Card>
              <CardHeader><CardTitle className="text-base">Produtos e Marcas</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <MultiSelect
                  label="Marcas Fornecidas"
                  options={BRANDS_PRESETS}
                  value={form.brandsSupplied}
                  onChange={(v) => set("brandsSupplied", v)}
                  allowCustom
                />
                <MultiSelect
                  label="Linhas de Produtos"
                  options={[]}
                  value={form.productLines}
                  onChange={(v) => set("productLines", v)}
                  allowCustom
                />
                <div className="space-y-1">
                  <Label htmlFor="catalogUrl">URL do Catálogo</Label>
                  <Input
                    id="catalogUrl"
                    value={form.catalogUrl}
                    onChange={(e) => set("catalogUrl", e.target.value)}
                    placeholder="https://catalogo.empresa.com.br"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Avaliação ── */}
          <TabsContent value="avaliacao">
            <Card>
              <CardHeader><CardTitle className="text-base">Avaliação do Fornecedor</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Avaliação Geral</Label>
                  <StarRating value={form.rating} onChange={(v) => set("rating", v)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ratingNotes">Notas sobre a Avaliação</Label>
                  <Textarea
                    id="ratingNotes"
                    value={form.ratingNotes}
                    onChange={(e) => set("ratingNotes", e.target.value)}
                    placeholder="Qualidade dos produtos, pontualidade, atendimento..."
                    rows={4}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="firstPurchaseDate">Data da Primeira Compra</Label>
                  <Input
                    id="firstPurchaseDate"
                    type="date"
                    value={form.firstPurchaseDate}
                    onChange={(e) => set("firstPurchaseDate", e.target.value)}
                    className="w-48"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Botões de ação */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(isEdit ? `/fornecedores/${id}` : "/fornecedores")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? "Salvar Alterações" : "Cadastrar Fornecedor"}
          </Button>
        </div>
      </form>
    </div>
  );
}
