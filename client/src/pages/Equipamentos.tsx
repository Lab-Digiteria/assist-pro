import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Smartphone, Tablet, Monitor, Laptop, Watch, Gamepad2, Tv } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const CATEGORIAS = [
  { value: "smartphone", label: "Smartphone", icon: Smartphone },
  { value: "tablet", label: "Tablet", icon: Tablet },
  { value: "notebook", label: "Notebook", icon: Laptop },
  { value: "desktop", label: "Desktop", icon: Monitor },
  { value: "smartwatch", label: "Smartwatch", icon: Watch },
  { value: "console", label: "Console", icon: Gamepad2 },
  { value: "tv", label: "TV", icon: Tv },
  { value: "outro", label: "Outro", icon: Smartphone },
];

const IMEI_CATS = ["smartphone", "tablet"];

export default function Equipamentos() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const empty = { clienteId: 0, categoria: "smartphone" as any, marca: "", modelo: "", numeroSerie: "", imei: "", capacidade: "", cor: "" };
  const [form, setForm] = useState(empty);
  const utils = trpc.useUtils();
  const { data: equips = [], isLoading } = trpc.equipamentos.list.useQuery({ search });
  const { data: clientes = [] } = trpc.clientes.list.useQuery({});
  const create = trpc.equipamentos.create.useMutation({
    onSuccess: () => { toast.success("Equipamento cadastrado!"); setOpen(false); utils.equipamentos.list.invalidate(); setForm(empty); },
    onError: (e) => toast.error(e.message),
  });
  const needsImei = IMEI_CATS.includes(form.categoria);
  return (
    <AppLayout title="Equipamentos">
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por marca, modelo, IMEI..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button style={{ background: "#1B4F8A" }}><Plus className="w-4 h-4 mr-2" />Novo Equipamento</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Novo Equipamento</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Cliente *</Label>
                  <Select value={String(form.clienteId)} onValueChange={v => setForm({...form, clienteId: Number(v)})}>
                    <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                    <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Categoria *</Label>
                  <Select value={form.categoria} onValueChange={v => setForm({...form, categoria: v as any})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIAS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Marca *</Label><Input value={form.marca} onChange={e => setForm({...form, marca: e.target.value})} /></div>
                  <div><Label>Modelo *</Label><Input value={form.modelo} onChange={e => setForm({...form, modelo: e.target.value})} /></div>
                </div>
                {needsImei && <div><Label>IMEI * (15 dígitos)</Label><Input value={form.imei} maxLength={15} onChange={e => setForm({...form, imei: e.target.value.replace(/\D/g,"")})} /></div>}
                <div><Label>Número de Série</Label><Input value={form.numeroSerie} onChange={e => setForm({...form, numeroSerie: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Capacidade</Label><Input placeholder="128GB" value={form.capacidade} onChange={e => setForm({...form, capacidade: e.target.value})} /></div>
                  <div><Label>Cor</Label><Input value={form.cor} onChange={e => setForm({...form, cor: e.target.value})} /></div>
                </div>
                <Button className="w-full" style={{ background: "#1B4F8A" }} onClick={() => create.mutate(form)} disabled={create.isPending}>
                  {create.isPending ? "Salvando..." : "Cadastrar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {isLoading ? <div className="text-center py-12 text-muted-foreground">Carregando...</div> :
          equips.length === 0 ? <div className="text-center py-12 text-muted-foreground">Nenhum equipamento encontrado.</div> :
          <div className="grid gap-3">
            {equips.map(e => {
              const cat = CATEGORIAS.find(c => c.value === e.categoria);
              const Icon = cat?.icon ?? Smartphone;
              return (
                <Card key={e.id}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{e.marca} {e.modelo}</p>
                        <Badge variant="outline" className="text-xs">{cat?.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{e.clienteNome}</p>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                        {e.imei && <span>IMEI: {e.imei}</span>}
                        {e.numeroSerie && <span>S/N: {e.numeroSerie}</span>}
                        {e.capacidade && <span>{e.capacidade}</span>}
                        {e.cor && <span>{e.cor}</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        }
      </div>
    </AppLayout>
  );
}
