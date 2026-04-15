import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, User, Building2, Phone, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Clientes() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ tipo: "pf" as "pf"|"pj", nome: "", cpfCnpj: "", whatsapp: "", email: "", cidade: "", estado: "" });
  const utils = trpc.useUtils();
  const { data: clientes = [], isLoading } = trpc.clientes.list.useQuery({ search });
  const create = trpc.clientes.create.useMutation({
    onSuccess: () => { toast.success("Cliente cadastrado!"); setOpen(false); utils.clientes.list.invalidate(); setForm({ tipo: "pf", nome: "", cpfCnpj: "", whatsapp: "", email: "", cidade: "", estado: "" }); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <AppLayout title="Clientes">
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome, CPF/CNPJ ou WhatsApp..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button style={{ background: "#1B4F8A" }}><Plus className="w-4 h-4 mr-2" />Novo Cliente</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={v => setForm({...form, tipo: v as any})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="pf">Pessoa Física</SelectItem><SelectItem value="pj">Pessoa Jurídica</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Nome {form.tipo === "pj" ? "/ Razão Social" : ""} *</Label><Input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} /></div>
                <div><Label>CPF {form.tipo === "pj" ? "/ CNPJ" : ""}</Label><Input value={form.cpfCnpj} onChange={e => setForm({...form, cpfCnpj: e.target.value})} /></div>
                <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} /></div>
                <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Cidade</Label><Input value={form.cidade} onChange={e => setForm({...form, cidade: e.target.value})} /></div>
                  <div><Label>Estado</Label><Input maxLength={2} value={form.estado} onChange={e => setForm({...form, estado: e.target.value.toUpperCase()})} /></div>
                </div>
                <Button className="w-full" style={{ background: "#1B4F8A" }} onClick={() => create.mutate(form)} disabled={create.isPending}>
                  {create.isPending ? "Salvando..." : "Cadastrar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {isLoading ? <div className="text-center py-12 text-muted-foreground">Carregando...</div> :
          clientes.length === 0 ? <div className="text-center py-12 text-muted-foreground">Nenhum cliente encontrado.</div> :
          <div className="grid gap-3">
            {clientes.map(c => (
              <Card key={c.id}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {c.tipo === "pj" ? <Building2 className="w-5 h-5 text-primary" /> : <User className="w-5 h-5 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{c.nome}</p>
                    <p className="text-sm text-muted-foreground">{c.cpfCnpj}</p>
                    <div className="flex gap-4 mt-1">
                      {c.whatsapp && <span className="text-xs flex items-center gap-1"><Phone className="w-3 h-3" />{c.whatsapp}</span>}
                      {c.email && <span className="text-xs flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
                    </div>
                  </div>
                  {c.cidade && <span className="text-xs text-muted-foreground">{c.cidade}/{c.estado}</span>}
                </CardContent>
              </Card>
            ))}
          </div>
        }
      </div>
    </AppLayout>
  );
}
