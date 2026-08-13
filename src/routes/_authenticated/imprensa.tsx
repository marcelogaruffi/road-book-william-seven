import { createFileRoute } from "@tanstack/react-router";
import { Route as AuthedRoute } from "./route";
import { Newspaper, Mail, Plus, Trash2, Search, Link as LinkIcon, ExternalLink, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePermissions } from "@/hooks/usePermissions";

export const Route = createFileRoute("/_authenticated/imprensa")({
  head: () => ({ meta: [{ title: "Imprensa - Seven Produções Artísticas" }] }),
  component: ImprensaPage,
});

function ImprensaPage() {
  const { profile } = AuthedRoute.useRouteContext();
  const { canAccessImprensa: isAllowed } = usePermissions(profile);

  const [mailing, setMailing] = useState<any[]>([]);
  const [clipping, setClipping] = useState<any[]>([]);
  const [espetaculos, setEspetaculos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isMailingOpen, setIsMailingOpen] = useState(false);
  const [isClippingOpen, setIsClippingOpen] = useState(false);

  // Form states
  const [newMailing, setNewMailing] = useState({ nome: '', veiculo: '', tipo_midia: 'Portal', email: '', telefone: '', notas: '' });
  const [newClipping, setNewClipping] = useState({ espetaculo: '', veiculo: '', titulo_materia: '', link_materia: '', data_publicacao: '' });

  useEffect(() => {
    if (isAllowed) {
      fetchData();
    }
  }, [isAllowed]);

  const fetchData = async () => {
    setLoading(true);
    const [mailingRes, clippingRes, espRes] = await Promise.all([
      supabase.from('imprensa_mailing').select('*').order('nome'),
      supabase.from('imprensa_clipping').select('*').order('data_publicacao', { ascending: false }),
      supabase.from('templates_espetaculos').select('nome_espetaculo')
    ]);

    if (mailingRes.data) setMailing(mailingRes.data);
    if (clippingRes.data) setClipping(clippingRes.data);
    if (espRes.data) {
      const names = Array.from(new Set(espRes.data.map(e => e.nome_espetaculo))).filter(Boolean) as string[];
      setEspetaculos(names);
    }
    setLoading(false);
  };

  const saveMailing = async () => {
    if (!newMailing.nome || !newMailing.veiculo) {
      toast.error('Preencha nome e veículo');
      return;
    }
    const { data, error } = await supabase.from('imprensa_mailing').insert([newMailing]).select().single();
    if (error) {
      toast.error('Erro ao salvar contato');
    } else {
      toast.success('Contato salvo!');
      setMailing([...mailing, data].sort((a, b) => a.nome.localeCompare(b.nome)));
      setIsMailingOpen(false);
      setNewMailing({ nome: '', veiculo: '', tipo_midia: 'Portal', email: '', telefone: '', notas: '' });
    }
  };

  const saveClipping = async () => {
    if (!newClipping.titulo_materia || !newClipping.veiculo || !newClipping.data_publicacao) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    const { data, error } = await supabase.from('imprensa_clipping').insert([newClipping]).select().single();
    if (error) {
      toast.error('Erro ao salvar clipping');
    } else {
      toast.success('Clipping salvo!');
      setClipping([data, ...clipping]);
      setIsClippingOpen(false);
      setNewClipping({ espetaculo: '', veiculo: '', titulo_materia: '', link_materia: '', data_publicacao: '' });
    }
  };

  const deleteMailing = async (id: string) => {
    if (confirm('Deletar este contato?')) {
      await supabase.from('imprensa_mailing').delete().eq('id', id);
      setMailing(mailing.filter(m => m.id !== id));
      toast.success('Deletado com sucesso');
    }
  };

  const deleteClipping = async (id: string) => {
    if (confirm('Deletar este clipping?')) {
      await supabase.from('imprensa_clipping').delete().eq('id', id);
      setClipping(clipping.filter(c => c.id !== id));
      toast.success('Deletado com sucesso');
    }
  };

  if (!isAllowed) {
    return (
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center py-24 px-6 text-center">
        <div className="bg-red-500/10 text-red-500 p-6 rounded-3xl mb-6">
          <Newspaper className="size-12" />
        </div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Acesso Negado</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-4 max-w-md">
          Você não tem permissão para acessar o painel de Assessoria de Imprensa.
        </p>
      </div>
    );
  }

  const filteredMailing = mailing.filter(m => 
    m.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.veiculo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8 pt-6 mb-16 md:mb-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Newspaper className="size-8 text-primary" />
            Assessoria de Imprensa
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Mailing de jornalistas e Clipping de resultados.
          </p>
        </div>
      </div>

      <Tabs defaultValue="mailing" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="mailing" className="flex items-center gap-2"><Mail className="size-4" /> Mailing de Contatos</TabsTrigger>
          <TabsTrigger value="clipping" className="flex items-center gap-2"><LinkIcon className="size-4" /> Clipping / Publicações</TabsTrigger>
        </TabsList>

        {/* TAB MAILING */}
        <TabsContent value="mailing" className="mt-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative w-full max-w-md">
              <Search className="size-4 absolute left-3 top-3 text-slate-400" />
              <Input 
                placeholder="Buscar contato ou veículo..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>
            
            <Dialog open={isMailingOpen} onOpenChange={setIsMailingOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl"><Plus className="size-4 mr-2" /> Novo Contato</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Adicionar Contato de Imprensa</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Nome do Jornalista/Contato</Label>
                    <Input value={newMailing.nome} onChange={e => setNewMailing({...newMailing, nome: e.target.value})} placeholder="Ex: Maria Silva" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Veículo</Label>
                      <Input value={newMailing.veiculo} onChange={e => setNewMailing({...newMailing, veiculo: e.target.value})} placeholder="Ex: Globo, G1, Rádio XYZ" />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Mídia</Label>
                      <Select value={newMailing.tipo_midia} onValueChange={v => setNewMailing({...newMailing, tipo_midia: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TV">TV</SelectItem>
                          <SelectItem value="Rádio">Rádio</SelectItem>
                          <SelectItem value="Portal / Web">Portal / Web</SelectItem>
                          <SelectItem value="Impresso">Impresso</SelectItem>
                          <SelectItem value="Influenciador">Influenciador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>E-mail</Label>
                      <Input type="email" value={newMailing.email} onChange={e => setNewMailing({...newMailing, email: e.target.value})} placeholder="maria@exemplo.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefone / WhatsApp</Label>
                      <Input value={newMailing.telefone} onChange={e => setNewMailing({...newMailing, telefone: e.target.value})} placeholder="(11) 99999-9999" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notas Adicionais</Label>
                    <Textarea value={newMailing.notas} onChange={e => setNewMailing({...newMailing, notas: e.target.value})} placeholder="Ex: Pede ingressos de cortesia, foca em cultura..." />
                  </div>
                  <Button onClick={saveMailing} className="w-full">Salvar Contato</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredMailing.map(contato => (
                <Card key={contato.id} className="border-0 shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden hover:shadow-md transition-shadow group relative">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="destructive" size="icon" className="size-8 rounded-full" onClick={() => deleteMailing(contato.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md">
                        {contato.tipo_midia}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{contato.nome}</CardTitle>
                    <CardDescription className="font-semibold text-primary">{contato.veiculo}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    {contato.email && <div><span className="font-medium text-slate-500">Email:</span> {contato.email}</div>}
                    {contato.telefone && <div><span className="font-medium text-slate-500">Tel:</span> {contato.telefone}</div>}
                    {contato.notas && <div className="pt-2 mt-2 border-t text-xs italic">{contato.notas}</div>}
                  </CardContent>
                </Card>
              ))}
              {filteredMailing.length === 0 && <div className="col-span-full text-center py-12 text-slate-400">Nenhum contato encontrado.</div>}
            </div>
          )}
        </TabsContent>

        {/* TAB CLIPPING */}
        <TabsContent value="clipping" className="mt-6 space-y-6">
          <div className="flex justify-end">
            <Dialog open={isClippingOpen} onOpenChange={setIsClippingOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white"><Plus className="size-4 mr-2" /> Registrar Publicação</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Registrar Clipping</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Espetáculo</Label>
                    <Select value={newClipping.espetaculo} onValueChange={v => setNewClipping({...newClipping, espetaculo: v})}>
                      <SelectTrigger><SelectValue placeholder="Selecione o espetáculo" /></SelectTrigger>
                      <SelectContent>
                        {espetaculos.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Título da Matéria</Label>
                    <Input value={newClipping.titulo_materia} onChange={e => setNewClipping({...newClipping, titulo_materia: e.target.value})} placeholder="Ex: Peça encanta público no RJ" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Veículo</Label>
                      <Input value={newClipping.veiculo} onChange={e => setNewClipping({...newClipping, veiculo: e.target.value})} placeholder="Ex: O Globo" />
                    </div>
                    <div className="space-y-2">
                      <Label>Data de Publicação</Label>
                      <Input type="date" value={newClipping.data_publicacao} onChange={e => setNewClipping({...newClipping, data_publicacao: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Link da Matéria</Label>
                    <Input value={newClipping.link_materia} onChange={e => setNewClipping({...newClipping, link_materia: e.target.value})} placeholder="https://" />
                  </div>
                  <Button onClick={saveClipping} className="w-full bg-blue-600 hover:bg-blue-700">Salvar Clipping</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clipping.map(clip => (
              <Card key={clip.id} className="border-0 shadow-sm bg-white dark:bg-slate-900 rounded-2xl p-4 flex gap-4 relative group">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="size-8 text-red-500 hover:bg-red-50 rounded-full" onClick={() => deleteClipping(clip.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-center justify-center shrink-0">
                  <Newspaper className="size-8 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500">{new Date(clip.data_publicacao + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 rounded-sm truncate">
                      {clip.espetaculo}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-white truncate" title={clip.titulo_materia}>{clip.titulo_materia}</h3>
                  <p className="text-sm text-slate-500 font-medium truncate">{clip.veiculo}</p>
                  
                  {clip.link_materia && (
                    <a href={clip.link_materia} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 mt-2">
                      Ler matéria original <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              </Card>
            ))}
            {clipping.length === 0 && !loading && <div className="col-span-full text-center py-12 text-slate-400">Nenhum clipping registrado.</div>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
