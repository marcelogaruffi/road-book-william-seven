import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Contact2, Plus, Search, MapPin, Phone, Mail, FileText, Trash2, Edit2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute('/_authenticated/fornecedores')({
  component: FornecedoresPage
});

type Fornecedor = {
  id: string;
  nome: string;
  categoria: string;
  cidade: string;
  telefone: string;
  contato: string;
  email: string;
  observacoes: string;
};

const categorias = ["Áudio / Som", "Iluminação", "Vans e Transporte", "Hospedagem", "Catering", "Estúdio", "Outros"];

function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Fornecedor>>({});

  useEffect(() => {
    fetchFornecedores();
  }, []);

  async function fetchFornecedores() {
    setLoading(true);
    const { data, error } = await supabase.from('fornecedores').select('*').order('nome');
    if (error) {
      if (error.code === '42P01') {
         toast.error("Tabela 'fornecedores' não existe no banco de dados ainda.");
      }
    } else {
      setFornecedores(data || []);
    }
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.nome) return toast.error("O nome é obrigatório");

    const { error } = await supabase.from('fornecedores').upsert({
      id: editId || undefined,
      ...formData
    });

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Fornecedor salvo com sucesso!");
      setModalOpen(false);
      fetchFornecedores();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este fornecedor?")) return;
    const { error } = await supabase.from('fornecedores').delete().eq('id', id);
    if (error) toast.error("Erro ao excluir: " + error.message);
    else {
      toast.success("Excluído!");
      fetchFornecedores();
    }
  }

  function openNew() {
    setEditId(null);
    setFormData({ categoria: 'Outros' });
    setModalOpen(true);
  }

  function openEdit(f: Fornecedor) {
    setEditId(f.id);
    setFormData(f);
    setModalOpen(true);
  }

  const filtrados = fornecedores.filter(f => 
    (filtroCategoria ? f.categoria === filtroCategoria : true) &&
    (busca ? (f.nome?.toLowerCase().includes(busca.toLowerCase()) || f.cidade?.toLowerCase().includes(busca.toLowerCase())) : true)
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto p-4 md:p-8 pt-6 mb-16 md:mb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <Contact2 className="size-8 text-primary" />
            Diretório de Fornecedores
          </h1>
          <p className="text-slate-500 mt-1">Sua agenda global de empresas, locadoras e contatos da turnê.</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="size-4" /> Novo Fornecedor</Button>
      </div>

      <Card>
        <CardHeader className="bg-slate-50 border-b flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input 
              placeholder="Buscar por nome ou cidade..." 
              className="pl-9 bg-white" 
              value={busca} 
              onChange={e => setBusca(e.target.value)} 
            />
          </div>
          <select 
            className="flex h-10 w-full sm:w-64 rounded-md border border-input bg-white px-3"
            value={filtroCategoria}
            onChange={e => setFiltroCategoria(e.target.value)}
          >
            <option value="">Todas as Categorias</option>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x border-b last:border-b-0">
            {filtrados.length === 0 && !loading && (
              <div className="col-span-full p-12 text-center text-slate-400">Nenhum fornecedor encontrado.</div>
            )}
            {filtrados.map(f => (
              <div key={f.id} className="p-6 hover:bg-slate-50 transition-colors group relative">
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="size-8 text-slate-500" onClick={() => openEdit(f)}><Edit2 className="size-4" /></Button>
                  <Button variant="ghost" size="icon" className="size-8 text-red-500" onClick={() => handleDelete(f.id)}><Trash2 className="size-4" /></Button>
                </div>
                <div className="inline-block px-2 py-1 rounded-md text-xs font-bold bg-primary/10 text-primary mb-3">
                  {f.categoria}
                </div>
                <h3 className="font-bold text-lg text-slate-800 mb-4 pr-12">{f.nome}</h3>
                <div className="space-y-2 text-sm text-slate-600">
                  {f.cidade && <div className="flex items-start gap-2"><MapPin className="size-4 shrink-0 text-slate-400 mt-0.5" /> <span>{f.cidade}</span></div>}
                  {f.contato && <div className="flex items-start gap-2"><Contact2 className="size-4 shrink-0 text-slate-400 mt-0.5" /> <span>{f.contato}</span></div>}
                  {f.telefone && <div className="flex items-start gap-2"><Phone className="size-4 shrink-0 text-slate-400 mt-0.5" /> <span>{f.telefone}</span></div>}
                  {f.email && <div className="flex items-start gap-2"><Mail className="size-4 shrink-0 text-slate-400 mt-0.5" /> <span>{f.email}</span></div>}
                  {f.observacoes && <div className="flex items-start gap-2 pt-2 mt-2 border-t"><FileText className="size-4 shrink-0 text-slate-400 mt-0.5" /> <span className="line-clamp-2 text-xs italic">{f.observacoes}</span></div>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editId ? 'Editar' : 'Novo'} Fornecedor</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2 md:col-span-2"><Label>Nome da Empresa *</Label><Input value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value})} required /></div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-white px-3" value={formData.categoria || ''} onChange={e => setFormData({...formData, categoria: e.target.value})}>
                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2"><Label>Cidade / Base</Label><Input value={formData.cidade || ''} onChange={e => setFormData({...formData, cidade: e.target.value})} placeholder="Ex: São Paulo, SP" /></div>
            <div className="space-y-2"><Label>Nome do Contato</Label><Input value={formData.contato || ''} onChange={e => setFormData({...formData, contato: e.target.value})} placeholder="Ex: João da Van" /></div>
            <div className="space-y-2"><Label>Telefone / WhatsApp</Label><Input value={formData.telefone || ''} onChange={e => setFormData({...formData, telefone: e.target.value})} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Email</Label><Input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Observações e Preços</Label><Input value={formData.observacoes || ''} onChange={e => setFormData({...formData, observacoes: e.target.value})} /></div>
            <div className="md:col-span-2 pt-4 flex justify-end"><Button type="submit" className="w-full sm:w-auto">Salvar Fornecedor</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
