import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FileSignature, Plus, Search, FileText, Trash2, Edit2, Eye, Download } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute('/_authenticated/contratos')({
  component: ContratosPage
});

type Contrato = {
  id: string;
  titulo: string;
  categoria: string;
  data_vencimento: string | null;
  arquivo_url: string;
  observacoes: string;
};

const categorias = ["Contratos de Serviço", "Alvarás e Liberações", "Notas Fiscais", "ECAD", "Documentos Pessoais", "Outros"];

function ContratosPage() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Contrato>>({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchContratos();
  }, []);

  async function fetchContratos() {
    setLoading(true);
    const { data, error } = await supabase.from('contratos').select('*').order('created_at', { ascending: false });
    if (error) {
      if (error.code === '42P01') {
         toast.error("Tabela 'contratos' não existe no banco de dados.");
      }
    } else {
      setContratos(data || []);
    }
    setLoading(false);
  }

  async function uploadFile(file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `contratos/${fileName}`;
    const { error: uploadError } = await supabase.storage.from('midias_eventos').upload(filePath, file);
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = supabase.storage.from('midias_eventos').getPublicUrl(filePath);
    return publicUrl;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.titulo) return toast.error("O título é obrigatório");
    
    setUploading(true);
    let arquivo_url = formData.arquivo_url || "";
    
    try {
      const file = fileInputRef.current?.files?.[0];
      if (file) {
        arquivo_url = await uploadFile(file);
      } else if (!editId) {
        toast.error("Você precisa anexar um arquivo.");
        setUploading(false);
        return;
      }

      const { error } = await supabase.from('contratos').upsert({
        id: editId || undefined,
        titulo: formData.titulo,
        categoria: formData.categoria || "Outros",
        data_vencimento: formData.data_vencimento || null,
        observacoes: formData.observacoes || "",
        arquivo_url
      });

      if (error) throw error;
      toast.success("Documento salvo com sucesso!");
      setModalOpen(false);
      fetchContratos();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
    setUploading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este documento?")) return;
    const { error } = await supabase.from('contratos').delete().eq('id', id);
    if (error) toast.error("Erro ao excluir: " + error.message);
    else {
      toast.success("Excluído!");
      fetchContratos();
    }
  }

  function openNew() {
    setEditId(null);
    setFormData({ categoria: 'Contratos de Serviço' });
    if (fileInputRef.current) fileInputRef.current.value = "";
    setModalOpen(true);
  }

  function openEdit(c: Contrato) {
    setEditId(c.id);
    setFormData(c);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setModalOpen(true);
  }

  const filtrados = contratos.filter(c => 
    (filtroCategoria ? c.categoria === filtroCategoria : true) &&
    (busca ? c.titulo?.toLowerCase().includes(busca.toLowerCase()) : true)
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto p-4 md:p-8 pt-6 mb-16 md:mb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <FileSignature className="size-8 text-primary" />
            Contratos e Documentos
          </h1>
          <p className="text-slate-500 mt-1">Repositório jurídico, alvarás, notas fiscais e recibos.</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="size-4" /> Novo Documento</Button>
      </div>

      <Card>
        <CardHeader className="bg-slate-50 border-b flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input 
              placeholder="Buscar documento..." 
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
          <div className="flex flex-col divide-y">
            {filtrados.length === 0 && !loading && (
              <div className="p-12 text-center text-slate-400">Nenhum documento encontrado.</div>
            )}
            {filtrados.map(c => (
              <div key={c.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                    <FileText className="size-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{c.titulo}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <span className="bg-slate-200 px-2 py-0.5 rounded text-slate-700">{c.categoria}</span>
                      {c.data_vencimento && <span className="text-red-500">Vencimento: {new Date(c.data_vencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span>}
                    </div>
                    {c.observacoes && <p className="text-sm text-slate-500 mt-1">{c.observacoes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="secondary" size="sm" asChild className="gap-2">
                    <a href={c.arquivo_url} target="_blank" rel="noreferrer"><Eye className="size-4" /> Ver</a>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Edit2 className="size-4 text-slate-500" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="size-4 text-red-500" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editId ? 'Editar' : 'Novo'} Documento</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-4">
            <div className="space-y-2"><Label>Título do Documento *</Label><Input value={formData.titulo || ''} onChange={e => setFormData({...formData, titulo: e.target.value})} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-white px-3" value={formData.categoria || ''} onChange={e => setFormData({...formData, categoria: e.target.value})}>
                  {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2"><Label>Data de Vencimento</Label><Input type="date" value={formData.data_vencimento || ''} onChange={e => setFormData({...formData, data_vencimento: e.target.value})} /></div>
            </div>
            <div className="space-y-2"><Label>Observações</Label><Input value={formData.observacoes || ''} onChange={e => setFormData({...formData, observacoes: e.target.value})} /></div>
            <div className="space-y-2">
              <Label>Arquivo (PDF/Img)</Label>
              <Input type="file" ref={fileInputRef} accept="application/pdf,image/*" />
              {editId && formData.arquivo_url && <p className="text-xs text-slate-500">Deixe em branco para manter o arquivo atual.</p>}
            </div>
            <div className="pt-4 flex justify-end"><Button type="submit" disabled={uploading}>{uploading ? 'Salvando...' : 'Salvar Documento'}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
