import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Music, Plus, Trash2, Pencil, Save, X, Users, Guitar } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/espetaculos")({
  head: () => ({ meta: [{ title: "Cadastro de Shows - Seven Produções Artísticas" }] }),
  component: EspetaculosPage,
});

type Espetaculo = {
  nome_espetaculo: string;
  descricao: string | null;
  personagens: string[] | null;
  instrumentos: string[] | null;
  created_at: string;
};

function EspetaculosPage() {
  const [espetaculos, setEspetaculos] = useState<Espetaculo[]>([]);
  const [loading, setLoading] = useState(false);

  const [novoNome, setNovoNome] = useState("");
  const [novaDescricao, setNovaDescricao] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescricao, setEditDescricao] = useState("");

  // Detalhes Modal State
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [selectedShow, setSelectedShow] = useState<Espetaculo | null>(null);
  const [personagensList, setPersonagensList] = useState<string[]>([]);
  const [instrumentosList, setInstrumentosList] = useState<string[]>([]);
  const [novoPersonagem, setNovoPersonagem] = useState("");
  const [novoInstrumento, setNovoInstrumento] = useState("");
  const [savingDetalhes, setSavingDetalhes] = useState(false);

  useEffect(() => {
    fetchEspetaculos();
  }, []);

  async function fetchEspetaculos() {
    setLoading(true);
    const { data, error } = await supabase
      .from("templates_espetaculos")
      .select("nome_espetaculo, descricao, personagens, instrumentos, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar shows");
    } else {
      setEspetaculos(data as Espetaculo[] || []);
    }
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!novoNome.trim()) return toast.error("O nome do show é obrigatório");

    const nomeFormatado = novoNome.trim();

    if (espetaculos.some(e => e.nome_espetaculo.toLowerCase() === nomeFormatado.toLowerCase())) {
      return toast.error("Já existe um show com esse nome");
    }

    const { data, error } = await supabase.from("templates_espetaculos").insert({
      nome_espetaculo: nomeFormatado,
      descricao: novaDescricao.trim() || null,
      personagens: [],
      instrumentos: []
    }).select("nome_espetaculo, descricao, personagens, instrumentos, created_at").single();

    if (error) {
      toast.error("Erro ao cadastrar show");
    } else {
      setEspetaculos([data as Espetaculo, ...espetaculos]);
      setNovoNome("");
      setNovaDescricao("");
      toast.success("Show cadastrado com sucesso!");
    }
  }

  async function handleDelete(nome: string) {
    if (!confirm(`ATENÇÃO: Deletar "${nome}" removerá também todos os checklists padrão atrelados a ele. Tem certeza?`)) return;
    
    const { error } = await supabase.from("templates_espetaculos").delete().eq("nome_espetaculo", nome);
    if (error) {
      toast.error("Erro ao deletar show");
    } else {
      setEspetaculos(espetaculos.filter(e => e.nome_espetaculo !== nome));
      toast.success("Show removido.");
    }
  }

  function startEditing(esp: Espetaculo) {
    setEditingId(esp.nome_espetaculo);
    setEditDescricao(esp.descricao || "");
  }

  async function handleSaveEdit(nome: string) {
    const { error } = await supabase.from("templates_espetaculos").update({
      descricao: editDescricao.trim() || null
    }).eq("nome_espetaculo", nome);

    if (error) {
      toast.error("Erro ao salvar descrição");
    } else {
      setEspetaculos(espetaculos.map(e => e.nome_espetaculo === nome ? { ...e, descricao: editDescricao.trim() || null } : e));
      setEditingId(null);
      toast.success("Descrição atualizada!");
    }
  }

  function openDetalhes(esp: Espetaculo) {
    setSelectedShow(esp);
    setPersonagensList(esp.personagens || []);
    setInstrumentosList(esp.instrumentos || []);
    setNovoPersonagem("");
    setNovoInstrumento("");
    setDetalhesOpen(true);
  }

  function addPersonagem() {
    if (!novoPersonagem.trim()) return;
    if (personagensList.includes(novoPersonagem.trim())) return toast.error("Personagem já adicionado");
    setPersonagensList([...personagensList, novoPersonagem.trim()]);
    setNovoPersonagem("");
  }

  function removePersonagem(nome: string) {
    setPersonagensList(personagensList.filter(p => p !== nome));
  }

  function addInstrumento() {
    if (!novoInstrumento.trim()) return;
    if (instrumentosList.includes(novoInstrumento.trim())) return toast.error("Instrumento já adicionado");
    setInstrumentosList([...instrumentosList, novoInstrumento.trim()]);
    setNovoInstrumento("");
  }

  function removeInstrumento(nome: string) {
    setInstrumentosList(instrumentosList.filter(i => i !== nome));
  }

  async function handleSaveDetalhes() {
    if (!selectedShow) return;
    setSavingDetalhes(true);
    
    const { error } = await supabase.from("templates_espetaculos").update({
      personagens: personagensList,
      instrumentos: instrumentosList
    }).eq("nome_espetaculo", selectedShow.nome_espetaculo);

    if (error) {
      toast.error("Erro ao salvar listas");
    } else {
      setEspetaculos(espetaculos.map(e => e.nome_espetaculo === selectedShow.nome_espetaculo 
        ? { ...e, personagens: personagensList, instrumentos: instrumentosList } 
        : e));
      toast.success("Listas atualizadas com sucesso!");
      setDetalhesOpen(false);
    }
    setSavingDetalhes(false);
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto p-4 md:p-8 pt-6 mb-16 md:mb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <Music className="size-8 text-primary" />
            Cadastro de Shows
          </h1>
          <p className="text-slate-500 mt-1">Gerencie os shows base, elencos e instrumentos para a turnê</p>
        </div>
      </div>

      <Card>
        <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b">
          <CardTitle>Cadastrar Novo Show</CardTitle>
          <CardDescription>
            Crie um novo molde de show para preencher o elenco, banda e configurar as funções de produção.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 items-end bg-slate-100 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10">
            <div className="w-full md:w-1/3 space-y-2">
              <Label>Nome do Show <span className="text-red-500">*</span></Label>
              <Input 
                placeholder="Ex: Turnê Acústico 2025" 
                value={novoNome}
                onChange={e => setNovoNome(e.target.value)}
              />
            </div>
            <div className="flex-1 w-full space-y-2">
              <Label>Descrição (Opcional)</Label>
              <Input 
                placeholder="Ex: Show voz e violão com duração de 90min" 
                value={novaDescricao}
                onChange={e => setNovaDescricao(e.target.value)}
              />
            </div>
            <Button type="submit" className="gap-2 shrink-0 h-10 w-full md:w-auto">
              <Plus className="size-4" /> Cadastrar Show
            </Button>
          </form>

          <div className="mt-8 border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nome do Show</th>
                  <th className="px-4 py-3 font-semibold">Descrição</th>
                  <th className="px-4 py-3 font-semibold text-center">Listas</th>
                  <th className="px-4 py-3 font-semibold text-right w-32">Ação</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      Carregando shows...
                    </td>
                  </tr>
                ) : espetaculos.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      Nenhum show cadastrado ainda.
                    </td>
                  </tr>
                ) : (
                  espetaculos.map((esp) => {
                    const isEditing = editingId === esp.nome_espetaculo;
                    const qtPersonagens = esp.personagens?.length || 0;
                    const qtInstrumentos = esp.instrumentos?.length || 0;
                    
                    return (
                      <tr key={esp.nome_espetaculo} className="border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">
                          {esp.nome_espetaculo}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          {isEditing ? (
                            <Input 
                              value={editDescricao}
                              onChange={e => setEditDescricao(e.target.value)}
                              className="h-8 max-w-sm"
                              placeholder="Descrição do show"
                              autoFocus
                            />
                          ) : (
                            esp.descricao || <span className="text-slate-400 italic">Sem descrição</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button variant="outline" size="sm" onClick={() => openDetalhes(esp)} className="gap-2 text-primary border-primary/20 bg-primary/5 hover:bg-primary/10 font-bold">
                            <Users className="size-4" /> Elenco & Banda
                          </Button>
                        </td>
                        <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                          {isEditing ? (
                            <>
                              <Button variant="ghost" size="icon" className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50" onClick={() => handleSaveEdit(esp.nome_espetaculo)}>
                                <Save className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700" onClick={() => setEditingId(null)}>
                                <X className="size-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="ghost" size="icon" className="text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => startEditing(esp)}>
                                <Pencil className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-red-500 transition-colors hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => handleDelete(esp.nome_espetaculo)}>
                                <Trash2 className="size-4" />
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL DE DETALHES (PERSONAGENS E INSTRUMENTOS) */}
      <Dialog open={detalhesOpen} onOpenChange={setDetalhesOpen}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              Gerenciar Detalhes - <span className="text-primary">{selectedShow?.nome_espetaculo}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
            
            {/* Coluna de Personagens */}
            <div className="bg-slate-50 rounded-2xl border p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Users className="size-5" /></div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">Personagens da Peça</h3>
                  <p className="text-xs text-slate-500">Ex: Romeu, Mufasa, Rei Arthur</p>
                </div>
              </div>
              
              <div className="flex gap-2 mb-4">
                <Input 
                  placeholder="Nome do personagem..." 
                  value={novoPersonagem} 
                  onChange={e => setNovoPersonagem(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPersonagem(); } }}
                />
                <Button onClick={addPersonagem} variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200"><Plus className="size-4" /></Button>
              </div>

              <div className="flex-1 overflow-y-auto border border-slate-200 bg-white rounded-xl divide-y">
                {personagensList.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-sm">Nenhum personagem cadastrado.</div>
                ) : (
                  personagensList.map((p, i) => (
                    <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50">
                      <span className="font-medium text-slate-700">{p}</span>
                      <Button variant="ghost" size="icon" onClick={() => removePersonagem(p)} className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="size-4" /></Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Coluna de Instrumentos */}
            <div className="bg-slate-50 rounded-2xl border p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Guitar className="size-5" /></div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">Instrumentos (Banda)</h3>
                  <p className="text-xs text-slate-500">Ex: Bateria, Violão, Teclado</p>
                </div>
              </div>
              
              <div className="flex gap-2 mb-4">
                <Input 
                  placeholder="Nome do instrumento..." 
                  value={novoInstrumento} 
                  onChange={e => setNovoInstrumento(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addInstrumento(); } }}
                />
                <Button onClick={addInstrumento} variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-200"><Plus className="size-4" /></Button>
              </div>

              <div className="flex-1 overflow-y-auto border border-slate-200 bg-white rounded-xl divide-y">
                {instrumentosList.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-sm">Nenhum instrumento cadastrado.</div>
                ) : (
                  instrumentosList.map((inst, i) => (
                    <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50">
                      <span className="font-medium text-slate-700">{inst}</span>
                      <Button variant="ghost" size="icon" onClick={() => removeInstrumento(inst)} className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="size-4" /></Button>
                    </div>
                  ))
                )}
              </div>
            </div>
            
          </div>
          
          <div className="pt-4 mt-2 border-t flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDetalhesOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveDetalhes} disabled={savingDetalhes} className="gap-2">
              {savingDetalhes ? 'Salvando...' : <><Save className="size-4" /> Salvar Alterações</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
