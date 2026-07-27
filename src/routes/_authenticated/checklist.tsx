import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckSquare, ListTodo, Plus, Trash2, MapPin, Play, CheckCircle2, Circle, Pencil, X, Save, GripVertical, Music } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Route as AuthedRoute } from "./route";

export const Route = createFileRoute("/_authenticated/checklist")({
  component: ChecklistPage,
});

type ChecklistPadrao = {
  id: string;
  item_nome: string;
  obrigatorio: boolean;
  ordem: number;
  espetaculo_nome: string;
  setor?: string;
};

type ChecklistEvento = {
  id: string;
  evento_id: string;
  item_nome: string;
  obrigatorio: boolean;
  concluido: boolean;
  ordem: number;
  setor?: string;
};

type Evento = {
  id: string;
  cidade: string;
  local: string;
  data: string;
  espetaculo: string;
};

const SETORES = ["Produção", "Luz", "Som", "Audiovisual", "Camarins", "Figurino", "Cenografia"];

function ChecklistPage() {
  const { profile } = AuthedRoute.useRouteContext();
  
  // Define quais setores o usuário pode ver baseado no role e funcoes
  const userRole = profile?.role || "elenco";
  const userFuncoes = profile?.funcoes || [];
  const hasRole = (r: string) => userRole === r || userFuncoes.includes(r);
  
  const canSeeAll = ["dev", "admin", "produtor", "assistente_producao", "tour_manager", "stage_manager", "contra_regra"].some(hasRole);
  
  const allowedSectores = SETORES.filter(s => {
    if (canSeeAll) return true;
    if (s === "Luz" && (hasRole("iluminador") || hasRole("roadie"))) return true;
    if (s === "Som" && (hasRole("tecnico_som") || hasRole("roadie"))) return true;
    if (s === "Audiovisual" && hasRole("tecnico_video")) return true;
    if ((s === "Camarins" || s === "Figurino") && hasRole("camareiro")) return true;
    if (s === "Cenografia" && hasRole("cenotecnico")) return true;
    if (s === "Produção") return true; // Produção visível como fallback para funções não mapeadas que chegam aqui
    return false;
  });

  const defaultSetor = allowedSectores.length > 0 ? allowedSectores[0] : "Produção";

  const [activeTab, setActiveTab] = useState("conferencia");
  const [selectedSetor, setSelectedSetor] = useState(defaultSetor);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [itensPadrao, setItensPadrao] = useState<ChecklistPadrao[]>([]);
  const [itensEvento, setItensEvento] = useState<ChecklistEvento[]>([]);
  const [espetaculosList, setEspetaculosList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // States for Conferência
  const [selectedEventoId, setSelectedEventoId] = useState("");
  const [novoItemExtraNome, setNovoItemExtraNome] = useState("");
  const [novoItemExtraObrigatorio, setNovoItemExtraObrigatorio] = useState(false);

  // States for Configuração Padrão
  const [selectedEspetaculoPadrao, setSelectedEspetaculoPadrao] = useState("");
  const [novoItemNome, setNovoItemNome] = useState("");
  const [novoItemObrigatorio, setNovoItemObrigatorio] = useState(false);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemNome, setEditItemNome] = useState("");
  const [editItemObrigatorio, setEditItemObrigatorio] = useState(false);

  // Drag and Drop refs
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    fetchDadosIniciais();
  }, []);

  useEffect(() => {
    if (selectedEventoId) {
      fetchChecklistEvento(selectedEventoId);
    } else {
      setItensEvento([]);
    }
  }, [selectedEventoId]);

  async function fetchDadosIniciais() {
    setLoading(true);
    try {
      const [padraoRes, evtRes, espRes] = await Promise.all([
        supabase.from("checklist_padrao").select("*").order("ordem", { ascending: true }).order("created_at", { ascending: true }),
        supabase.from("eventos").select("id, cidade, local, data, espetaculo").order("data", { ascending: false }),
        supabase.from("templates_espetaculos").select("nome_espetaculo").order("nome_espetaculo", { ascending: true })
      ]);

      if (padraoRes.data) setItensPadrao(padraoRes.data);
      if (evtRes.data) setEventos(evtRes.data);
      if (espRes.data) setEspetaculosList(espRes.data.map(e => e.nome_espetaculo));
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar dados do checklist");
    } finally {
      setLoading(false);
    }
  }

  async function fetchChecklistEvento(eventoId: string) {
    const { data, error } = await supabase.from("checklist_eventos").select("*").eq("evento_id", eventoId).order("ordem", { ascending: true });
    if (error) {
      toast.error("Erro ao buscar checklist do evento");
    } else {
      setItensEvento(data || []);
    }
  }

  // Ações - Configuração Padrão
  async function handleAddPadrao(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEspetaculoPadrao) return toast.error("Selecione um Espetáculo primeiro");
    if (!novoItemNome.trim()) return toast.error("Digite o nome do item");

    const itensDesteEspetaculo = itensPadrao.filter(i => i.espetaculo_nome === selectedEspetaculoPadrao && (i.setor || 'Produção') === selectedSetor);
    const novaOrdem = itensDesteEspetaculo.length > 0 ? Math.max(...itensDesteEspetaculo.map(i => i.ordem)) + 1 : 0;

    const { data, error } = await supabase.from("checklist_padrao").insert({
      espetaculo_nome: selectedEspetaculoPadrao,
      item_nome: novoItemNome,
      obrigatorio: novoItemObrigatorio,
      ordem: novaOrdem,
      setor: selectedSetor
    }).select().single();

    if (error) {
      toast.error("Erro ao adicionar item");
    } else {
      setItensPadrao([...itensPadrao, data]);
      setNovoItemNome("");
      setNovoItemObrigatorio(false);
      toast.success("Item adicionado ao padrão");
    }
  }

  async function handleRemovePadrao(id: string) {
    if (!confirm("Tem certeza que deseja remover este item do padrão?")) return;
    const { error } = await supabase.from("checklist_padrao").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover item");
    } else {
      setItensPadrao(itensPadrao.filter(i => i.id !== id));
      toast.success("Item removido");
    }
  }

  function startEditing(item: ChecklistPadrao) {
    setEditingItemId(item.id);
    setEditItemNome(item.item_nome);
    setEditItemObrigatorio(item.obrigatorio);
  }

  async function handleSaveEdit(id: string) {
    if (!editItemNome.trim()) return toast.error("O nome do item não pode ser vazio");
    
    const { error } = await supabase.from("checklist_padrao").update({
      item_nome: editItemNome,
      obrigatorio: editItemObrigatorio
    }).eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar item");
    } else {
      setItensPadrao(itensPadrao.map(i => i.id === id ? { ...i, item_nome: editItemNome, obrigatorio: editItemObrigatorio } : i));
      setEditingItemId(null);
      toast.success("Item atualizado com sucesso!");
    }
  }

  async function handleSort() {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    let _itens = [...itensPadrao.filter(i => i.espetaculo_nome === selectedEspetaculoPadrao && (i.setor || 'Produção') === selectedSetor)];
    const draggedItemContent = _itens.splice(dragItem.current, 1)[0];
    _itens.splice(dragOverItem.current, 0, draggedItemContent);
    
    dragItem.current = null;
    dragOverItem.current = null;
    
    // Update local order numbers to reflect new array position
    _itens = _itens.map((item, index) => ({ ...item, ordem: index }));
    
    // Atualizar no state global substituindo os antigos pelos novos
    const idsToUpdate = new Set(_itens.map(i => i.id));
    const otherItems = itensPadrao.filter(i => !idsToUpdate.has(i.id));
    setItensPadrao([...otherItems, ..._itens]);
    
    // Update in DB
    const { error } = await supabase.from('checklist_padrao').upsert(
      _itens.map(i => ({ 
        id: i.id, 
        espetaculo_nome: i.espetaculo_nome,
        item_nome: i.item_nome, 
        obrigatorio: i.obrigatorio, 
        ordem: i.ordem,
        setor: i.setor || 'Produção'
      }))
    );
    
    if (error) toast.error("Erro ao salvar nova ordem");
  }

  // Ações - Conferência (Evento)
  async function handleGerarChecklist() {
    if (!selectedEventoId) return;
    const eventoSelecionado = eventos.find(e => e.id === selectedEventoId);
    if (!eventoSelecionado) return;
    
    const itensDesteShow = itensPadrao.filter(i => i.espetaculo_nome === eventoSelecionado.espetaculo);
    
    if (itensDesteShow.length === 0) return toast.warning(`Não há itens no Checklist Padrão para o show "${eventoSelecionado.espetaculo}".`);

    setLoading(true);
    
    // Preparar itens para inserção baseados no padrão
    const itensParaInserir = itensDesteShow.map(item => ({
      evento_id: selectedEventoId,
      item_nome: item.item_nome,
      obrigatorio: item.obrigatorio,
      ordem: item.ordem,
      concluido: false,
      setor: item.setor || 'Produção'
    }));

    const { data, error } = await supabase.from("checklist_eventos").insert(itensParaInserir).select();
    
    setLoading(false);

    if (error) {
      toast.error("Erro ao gerar checklist para o evento");
    } else {
      toast.success("Checklist gerado com sucesso!");
      setItensEvento(data || []);
    }
  }

  async function toggleItemConcluido(id: string, atual: boolean) {
    // Optimistic update
    setItensEvento(itensEvento.map(i => i.id === id ? { ...i, concluido: !atual } : i));
    
    const { error } = await supabase.from("checklist_eventos").update({
      concluido: !atual,
      concluido_em: !atual ? new Date().toISOString() : null
    }).eq("id", id);

    if (error) {
      // Revert if error
      toast.error("Erro ao atualizar o item");
      setItensEvento(itensEvento.map(i => i.id === id ? { ...i, concluido: atual } : i));
    }
  }

  async function handleAddExtra(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEventoId) return;
    if (!novoItemExtraNome.trim()) return toast.error("Digite o nome do item extra");
    
    const novaOrdem = itensEvento.length > 0 ? Math.max(...itensEvento.map(i => i.ordem)) + 1 : 0;
    
    const { data, error } = await supabase.from("checklist_eventos").insert({
      evento_id: selectedEventoId,
      item_nome: novoItemExtraNome,
      obrigatorio: novoItemExtraObrigatorio,
      concluido: false,
      ordem: novaOrdem,
      setor: selectedSetor
    }).select().single();
    
    if (error) {
      toast.error("Erro ao adicionar item extra");
    } else {
      setItensEvento([...itensEvento, data]);
      setNovoItemExtraNome("");
      setNovoItemExtraObrigatorio(false);
      toast.success("Item extra adicionado!");
    }
  }

  async function handleRemoveItemEvento(id: string) {
    if (!confirm("Tem certeza que deseja remover este item?")) return;
    const { error } = await supabase.from("checklist_eventos").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover item");
    } else {
      setItensEvento(itensEvento.filter(i => i.id !== id));
      toast.success("Item removido");
    }
  }

  const displayedItensEvento = itensEvento.filter(i => (i.setor || 'Produção') === selectedSetor);
  const displayedItensPadrao = itensPadrao.filter(i => i.espetaculo_nome === selectedEspetaculoPadrao && (i.setor || 'Produção') === selectedSetor);
  
  const concluidosCount = displayedItensEvento.filter(i => i.concluido).length;
  const progresso = displayedItensEvento.length > 0 ? Math.round((concluidosCount / displayedItensEvento.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <CheckSquare className="size-8 text-primary" />
            Central de Checklists
          </h1>
          <p className="text-slate-500 mt-1">Gerenciamento de checklist e conferência dos eventos por setor</p>
        </div>
      </div>

      <div className="bg-slate-100/50 dark:bg-slate-800/30 p-2 rounded-3xl overflow-x-auto flex gap-2 hide-scrollbar">
        {allowedSectores.map(s => (
          <button
            key={s}
            onClick={() => setSelectedSetor(s)}
            className={`whitespace-nowrap rounded-2xl px-5 py-2.5 transition-all font-semibold text-sm ${
              selectedSetor === s
                ? "bg-white dark:bg-slate-200 text-primary dark:text-slate-900 shadow-md"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="conferencia" className="flex items-center gap-2">
            <ListTodo className="size-4" /> Conferência
          </TabsTrigger>
          <TabsTrigger value="configuracao" className="flex items-center gap-2">
            <CheckSquare className="size-4" /> Configuração Padrão
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conferencia" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="bg-slate-50 dark:bg-slate-800/50">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2 w-full">
                  <Label>Selecione o Evento para conferência</Label>
                  <select 
                    value={selectedEventoId} 
                    onChange={e => setSelectedEventoId(e.target.value)} 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Selecione um evento...</option>
                    {eventos.map(evt => (
                      <option key={evt.id} value={evt.id}>
                        {evt.cidade} - {evt.local} ({new Date(evt.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {!selectedEventoId ? (
                <div className="text-center py-12 text-slate-400 flex flex-col items-center">
                  <MapPin className="size-12 mb-4 opacity-50" />
                  <p>Selecione um evento acima para carregar o checklist.</p>
                </div>
              ) : displayedItensEvento.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center">
                  <ListTodo className="size-16 text-slate-300 mb-4" />
                  <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">Nenhum checklist gerado</h3>
                  <p className="text-slate-500 mt-2 mb-6 max-w-md">
                    Este evento ainda não tem um checklist. Você pode importar os itens automaticamente usando a sua Configuração Padrão.
                  </p>
                  <Button onClick={handleGerarChecklist} disabled={loading} size="lg" className="gap-2 transition-transform hover:scale-105">
                    <Play className="size-4" /> Iniciar Checklist do Evento
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Progress Bar */}
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-700 dark:text-slate-300">Progresso da Conferência</h4>
                      <p className="text-sm text-slate-500">{concluidosCount} de {displayedItensEvento.length} itens concluídos</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-3xl font-black transition-colors duration-500 ${progresso === 100 ? 'text-emerald-500' : 'text-primary'}`}>{progresso}%</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                    <div className={`h-full transition-all duration-500 ease-out ${progresso === 100 ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${progresso}%` }}></div>
                  </div>

                  {/* Checklist Items */}
                  <div className="grid gap-3">
                    {displayedItensEvento.map(item => (
                      <div 
                        key={item.id} 
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                          item.concluido 
                            ? 'border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 opacity-70' 
                            : 'border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:shadow-sm bg-white dark:bg-slate-900'
                        }`}
                        onClick={() => toggleItemConcluido(item.id, item.concluido)}
                      >
                        <button className="flex-shrink-0 outline-none">
                          {item.concluido ? (
                            <CheckCircle2 className="size-8 text-emerald-500 transition-transform hover:scale-110" />
                          ) : (
                            <Circle className="size-8 text-slate-300 dark:text-slate-600 transition-transform hover:scale-110" />
                          )}
                        </button>
                        <div className="flex-1">
                          <h4 className={`font-semibold text-lg transition-colors ${item.concluido ? 'text-slate-500 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                            {item.item_nome}
                          </h4>
                        </div>
                        {item.obrigatorio && !item.concluido && (
                          <span className="text-xs font-bold px-2 py-1 bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 rounded-md uppercase">
                            Obrigatório
                          </span>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 -mr-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveItemEvento(item.id);
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Add Extra Item Form */}
                  <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                    <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-4 text-sm uppercase tracking-wider">Adicionar Item Específico para este evento</h4>
                    <form onSubmit={handleAddExtra} className="flex flex-col sm:flex-row gap-4 items-end bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10">
                      <div className="flex-1 space-y-2">
                        <Label>Nome do Item Extra</Label>
                        <Input 
                          placeholder="Ex: Comprar bolo surpresa para o contratante" 
                          value={novoItemExtraNome}
                          onChange={e => setNovoItemExtraNome(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-2 pb-2 px-2">
                        <Switch 
                          checked={novoItemExtraObrigatorio}
                          onCheckedChange={setNovoItemExtraObrigatorio}
                        />
                        <Label className="cursor-pointer" onClick={() => setNovoItemExtraObrigatorio(!novoItemExtraObrigatorio)}>Obrigatório?</Label>
                      </div>
                      <Button type="submit" variant="secondary" className="gap-2 shrink-0">
                        <Plus className="size-4" /> Incluir no Evento
                      </Button>
                    </form>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuracao" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="bg-slate-50 dark:bg-slate-800/50">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Checklist Padrão</CardTitle>
                  <CardDescription>Configure os modelos base para cada tipo de show.</CardDescription>
                </div>
                <div className="w-full sm:w-64">
                  <select 
                    value={selectedEspetaculoPadrao}
                    onChange={e => setSelectedEspetaculoPadrao(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus:ring-2 focus:ring-primary/50 font-semibold"
                  >
                    <option value="">Selecione um show...</option>
                    {espetaculosList.map(esp => (
                      <option key={esp} value={esp}>{esp}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              
              {!selectedEspetaculoPadrao ? (
                <div className="text-center py-12 text-slate-400">
                  <Music className="size-12 mb-4 opacity-50 mx-auto" />
                  <p>Selecione um Tipo de Show acima para configurar o seu checklist padrão.</p>
                </div>
              ) : (
                <>
                  <form onSubmit={handleAddPadrao} className="flex flex-col sm:flex-row gap-4 items-end bg-slate-100 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10">
                <div className="flex-1 space-y-2">
                  <Label>O que precisa ser conferido?</Label>
                  <Input 
                    placeholder="Ex: Checar bateria do mic, Testar iluminação, etc..." 
                    value={novoItemNome}
                    onChange={e => setNovoItemNome(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 pb-2 px-2">
                  <Switch 
                    checked={novoItemObrigatorio}
                    onCheckedChange={setNovoItemObrigatorio}
                  />
                  <Label className="cursor-pointer" onClick={() => setNovoItemObrigatorio(!novoItemObrigatorio)}>Obrigatório?</Label>
                </div>
                <Button type="submit" className="gap-2">
                  <Plus className="size-4" /> Adicionar ao Padrão
                </Button>
              </form>

              <div className="border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Ordem</th>
                      <th className="px-4 py-3">Item de Conferência</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 w-20 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedItensPadrao.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                          Nenhum item padrão cadastrado para este show.
                        </td>
                      </tr>
                    ) : (
                      displayedItensPadrao.map((item, index) => {
                        const isEditing = editingItemId === item.id;

                        return (
                        <tr 
                          key={item.id} 
                          draggable
                          onDragStart={() => dragItem.current = index}
                          onDragEnter={() => dragOverItem.current = index}
                          onDragEnd={handleSort}
                          onDragOver={(e) => e.preventDefault()}
                          className="border-t transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-move"
                        >
                          <td className="px-4 py-3 text-slate-400 font-mono flex items-center gap-2">
                            <GripVertical className="size-4 text-slate-300" />
                            {index + 1}
                          </td>
                          
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <Input 
                                value={editItemNome} 
                                onChange={e => setEditItemNome(e.target.value)} 
                                className="h-8"
                                autoFocus
                              />
                            ) : (
                              <span className="font-medium">{item.item_nome}</span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <Switch checked={editItemObrigatorio} onCheckedChange={setEditItemObrigatorio} />
                                <span className="text-xs">Obrigatório</span>
                              </div>
                            ) : (
                              item.obrigatorio ? (
                                <span className="text-xs font-bold px-2 py-1 bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 rounded-md">Obrigatório</span>
                              ) : (
                                <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded-md">Opcional</span>
                              )
                            )}
                          </td>
                          
                          <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                            {isEditing ? (
                              <>
                                <Button variant="ghost" size="icon" className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50" onClick={() => handleSaveEdit(item.id)}>
                                  <Save className="size-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700" onClick={() => setEditingItemId(null)}>
                                  <X className="size-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button variant="ghost" size="icon" className="text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => startEditing(item)}>
                                  <Pencil className="size-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-red-500 transition-colors hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => handleRemovePadrao(item.id)}>
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

                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
