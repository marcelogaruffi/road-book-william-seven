import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckSquare, ListTodo, Plus, Trash2, MapPin, Play, CheckCircle2, 
  Circle, Pencil, X, Save, GripVertical, Music, Calendar, Sparkles, Filter, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Route as AuthedRoute } from "./route";

export const Route = createFileRoute("/_authenticated/checklist")({
  head: () => ({ meta: [{ title: "Prancheta de Check-list - Áxis" }] }),
  component: ChecklistPage,
});

type ChecklistPadrao = {
  id: string;
  item_nome: string;
  obrigatorio: boolean;
  ordem: number;
  espetaculo_nome: string;
  setor?: string;
  created_by?: string;
};

type ChecklistEvento = {
  id: string;
  evento_id: string;
  apresentacao_id?: string;
  item_nome: string;
  obrigatorio: boolean;
  concluido: boolean;
  ordem: number;
  setor?: string;
  usuario_id?: string;
};

type EventoItem = {
  id: string;
  cidade: string;
  local: string;
  data: string;
  espetaculo: string;
};

const TODOS_SETORES = [
  "Produção", 
  "Luz", 
  "Som", 
  "Audiovisual", 
  "Camarins", 
  "Figurino", 
  "Cenografia",
  "Contra-regragem",
  "Stage Manager"
];

function ChecklistPage() {
  const { profile } = AuthedRoute.useRouteContext();
  
  const userRole = profile?.role || "elenco";
  const userFuncoes = (profile as any)?.funcoes || [];
  const hasRole = (r: string) => userRole === r || userFuncoes.includes(r);
  
  const isGestao = ["dev", "admin", "produtor", "assistente_producao"].some(hasRole);
  
  // Setores permitidos por função:
  const allowedSectores = useMemo(() => {
    return TODOS_SETORES.filter(s => {
      if (isGestao) return true;
      if (s === "Luz" && hasRole("iluminador")) return true;
      if (s === "Som" && hasRole("tecnico_som")) return true;
      if (s === "Audiovisual" && hasRole("tecnico_video")) return true;
      if ((s === "Camarins" || s === "Figurino") && hasRole("camareiro")) return true;
      if (s === "Cenografia" && hasRole("cenotecnico")) return true;
      if (s === "Contra-regragem" && hasRole("contra_regra")) return true;
      if (s === "Stage Manager" && hasRole("stage_manager")) return true;
      return false;
    });
  }, [userRole, userFuncoes, isGestao]);

  const defaultSetor = allowedSectores.length > 0 ? allowedSectores[0] : "Produção";

  // Estados principais de seleção em cascata:
  const [selectedEspetaculo, setSelectedEspetaculo] = useState<string>("");
  const [selectedEventoId, setSelectedEventoId] = useState<string>("");
  const [selectedSetor, setSelectedSetor] = useState<string>(defaultSetor);
  const [activeTab, setActiveTab] = useState<"conferencia" | "configuracao">("conferencia");

  // Dados do banco:
  const [espetaculosList, setEspetaculosList] = useState<string[]>([]);
  const [todosEventos, setTodosEventos] = useState<EventoItem[]>([]);
  const [itensPadrao, setItensPadrao] = useState<ChecklistPadrao[]>([]);
  const [itensEvento, setItensEvento] = useState<ChecklistEvento[]>([]);
  const [loading, setLoading] = useState(false);

  // Formulário - Novo item padrão
  const [novoItemNome, setNovoItemNome] = useState("");
  const [novoItemObrigatorio, setNovoItemObrigatorio] = useState(false);

  // Formulário - Novo item extra evento
  const [novoItemExtraNome, setNovoItemExtraNome] = useState("");
  const [novoItemExtraObrigatorio, setNovoItemExtraObrigatorio] = useState(false);

  useEffect(() => {
    if (allowedSectores.length > 0 && !allowedSectores.includes(selectedSetor)) {
      setSelectedSetor(allowedSectores[0]);
    }
  }, [allowedSectores]);

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
        supabase.from("checklist_padrao").select("*").order("ordem", { ascending: true }),
        supabase.from("eventos").select("id, espetaculo, cidade, local, data").order("data", { ascending: false }),
        supabase.from("templates_espetaculos").select("nome_espetaculo").neq("nome_espetaculo", "ESTOQUE_GLOBAL").order("nome_espetaculo", { ascending: true })
      ]);

      if (padraoRes.data) setItensPadrao(padraoRes.data as any);
      if (evtRes.data) setTodosEventos(evtRes.data as any);
      if (espRes.data) setEspetaculosList(espRes.data.map(e => e.nome_espetaculo));
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar dados da prancheta");
    } finally {
      setLoading(false);
    }
  }

  async function fetchChecklistEvento(eventoId: string) {
    const { data, error } = await supabase
      .from("checklist_eventos")
      .select("*")
      .eq("evento_id", eventoId)
      .order("ordem", { ascending: true });

    if (error) {
      console.error(error);
      toast.error("Erro ao buscar conferência do evento");
    } else {
      setItensEvento((data as any) || []);
    }
  }

  // Eventos filtrados pelo espetáculo selecionado
  const eventosDoEspetaculo = useMemo(() => {
    if (!selectedEspetaculo) return [];
    return todosEventos.filter(e => e.espetaculo === selectedEspetaculo);
  }, [selectedEspetaculo, todosEventos]);

  // Se mudar o espetáculo, limpa o evento se ele não pertencer a esse show
  const handleSelectEspetaculo = (esp: string) => {
    setSelectedEspetaculo(esp);
    setSelectedEventoId("");
  };

  // Itens filtrados para exibição
  const displayedItensPadrao = useMemo(() => {
    return itensPadrao.filter(
      i => i.espetaculo_nome === selectedEspetaculo && (i.setor || "Produção") === selectedSetor
    );
  }, [itensPadrao, selectedEspetaculo, selectedSetor]);

  const displayedItensEvento = useMemo(() => {
    return itensEvento.filter(
      i => (i.setor || "Produção") === selectedSetor
    );
  }, [itensEvento, selectedSetor]);

  // Importar itens do padrão para o evento
  async function handleImportarPadrao() {
    if (!selectedEventoId) return toast.error("Selecione um evento primeiro.");
    if (!selectedEspetaculo) return toast.error("Selecione um espetáculo primeiro.");

    const itensParaImportar = displayedItensPadrao;
    if (itensParaImportar.length === 0) {
      return toast.info("Nenhum item padrão configurado para este setor e espetáculo. Adicione itens no modo 'Definir Padrões'.");
    }

    setLoading(true);
    const novosItens = itensParaImportar.map((item, index) => ({
      evento_id: selectedEventoId,
      item_nome: item.item_nome,
      obrigatorio: item.obrigatorio,
      concluido: false,
      ordem: index,
      setor: selectedSetor
    }));

    const { data, error } = await supabase.from("checklist_eventos").insert(novosItens).select();
    setLoading(false);

    if (error) {
      toast.error("Erro ao importar itens do padrão: " + error.message);
    } else {
      toast.success("Itens do padrão importados para conferência!");
      if (data) {
        setItensEvento(prev => [...prev, ...(data as any)]);
      }
    }
  }

  // Marcar/desmarcar item concluído
  async function handleToggleConcluido(itemId: string, concluidoAtual: boolean) {
    const novoStatus = !concluidoAtual;
    setItensEvento(prev => prev.map(i => i.id === itemId ? { ...i, concluido: novoStatus } : i));

    const { error } = await supabase
      .from("checklist_eventos")
      .update({ concluido: novoStatus })
      .eq("id", itemId);

    if (error) {
      toast.error("Erro ao atualizar status");
      // Revert
      setItensEvento(prev => prev.map(i => i.id === itemId ? { ...i, concluido: concluidoAtual } : i));
    }
  }

  // Adicionar item padrão
  async function handleAddPadrao(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEspetaculo) return toast.error("Selecione um espetáculo primeiro");
    if (!novoItemNome.trim()) return toast.error("Digite a descrição do item");

    const novaOrdem = displayedItensPadrao.length > 0 
      ? Math.max(...displayedItensPadrao.map(i => i.ordem || 0)) + 1 
      : 0;

    const { data, error } = await supabase.from("checklist_padrao").insert({
      espetaculo_nome: selectedEspetaculo,
      item_nome: novoItemNome.trim(),
      obrigatorio: novoItemObrigatorio,
      ordem: novaOrdem,
      setor: selectedSetor
    }).select().single();

    if (error) {
      toast.error("Erro ao salvar item no padrão: " + error.message);
    } else {
      toast.success("Item adicionado ao padrão!");
      setItensPadrao(prev => [...prev, data as any]);
      setNovoItemNome("");
      setNovoItemObrigatorio(false);
    }
  }

  // Adicionar item avulso no evento
  async function handleAddExtraEvento(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEventoId) return toast.error("Selecione um evento");
    if (!novoItemExtraNome.trim()) return toast.error("Digite o nome do item");

    const novaOrdem = displayedItensEvento.length > 0
      ? Math.max(...displayedItensEvento.map(i => i.ordem || 0)) + 1
      : 0;

    const { data, error } = await supabase.from("checklist_eventos").insert({
      evento_id: selectedEventoId,
      item_nome: novoItemExtraNome.trim(),
      obrigatorio: novoItemExtraObrigatorio,
      concluido: false,
      ordem: novaOrdem,
      setor: selectedSetor
    }).select().single();

    if (error) {
      toast.error("Erro ao adicionar item no evento");
    } else {
      toast.success("Item avulso incluído no evento!");
      setItensEvento(prev => [...prev, data as any]);
      setNovoItemExtraNome("");
      setNovoItemExtraObrigatorio(false);
    }
  }

  // Remoção padrão
  async function handleRemovePadrao(id: string) {
    if (!confirm("Remover este item do padrão?")) return;
    const { error } = await supabase.from("checklist_padrao").delete().eq("id", id);
    if (!error) {
      setItensPadrao(prev => prev.filter(i => i.id !== id));
      toast.success("Item removido");
    }
  }

  // Remoção evento
  async function handleRemoveItemEvento(id: string) {
    if (!confirm("Remover este item da conferência?")) return;
    const { error } = await supabase.from("checklist_eventos").delete().eq("id", id);
    if (!error) {
      setItensEvento(prev => prev.filter(i => i.id !== id));
      toast.success("Item removido");
    }
  }

  const concluidosCount = displayedItensEvento.filter(i => i.concluido).length;
  const progresso = displayedItensEvento.length > 0 ? Math.round((concluidosCount / displayedItensEvento.length) * 100) : 0;
  const eventoSelecionadoObj = todosEventos.find(e => e.id === selectedEventoId);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* HEADER DINÂMICO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <CheckSquare className="size-8 text-primary" />
            Prancheta de Check-list
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Conferência operacional e definição de padrões para a equipe de palco, técnica e produção.
          </p>
        </div>
      </div>

      {/* BARRA SUPERIOR DE SELEÇÃO EM CASCATA */}
      <Card className="border-0 shadow-sm bg-white dark:bg-card/70 dark:backdrop-blur-xl rounded-3xl p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          
          {/* 1. SELEÇÃO DO ESPETÁCULO */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Music className="size-3.5 text-primary" /> 1. Espetáculo
            </Label>
            <select
              value={selectedEspetaculo}
              onChange={(e) => handleSelectEspetaculo(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 font-bold text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/40 outline-none transition-all"
            >
              <option value="">Selecione o Espetáculo...</option>
              {espetaculosList.map((esp) => (
                <option key={esp} value={esp}>{esp}</option>
              ))}
            </select>
          </div>

          {/* 2. SELEÇÃO DO EVENTO (Só aparece após escolher espetáculo) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="size-3.5 text-primary" /> 2. Apresentação / Evento
            </Label>
            <select
              disabled={!selectedEspetaculo}
              value={selectedEventoId}
              onChange={(e) => setSelectedEventoId(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 font-bold text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/40 outline-none transition-all disabled:opacity-50"
            >
              <option value="">
                {!selectedEspetaculo ? "Escolha o espetáculo primeiro..." : "Selecione o Evento/Data..."}
              </option>
              {eventosDoEspetaculo.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.cidade} {ev.data ? `• ${ev.data.split('-').reverse().join('/')}` : ""} {ev.local ? `(${ev.local})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* 3. MODO: CONFERÊNCIA OU PADRÕES */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" /> 3. Modo de Operação
            </Label>
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab("conferencia")}
                className={`flex-1 h-9 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "conferencia"
                    ? "bg-white dark:bg-primary text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                <ListTodo className="size-3.5" /> Conferir Show
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("configuracao")}
                className={`flex-1 h-9 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "configuracao"
                    ? "bg-white dark:bg-primary text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                <CheckSquare className="size-3.5" /> Definir Padrões
              </button>
            </div>
          </div>

        </div>
      </Card>

      {/* SELEÇÃO DO SETOR (ABAS LIMPAS VISÍVEIS SOMENTE PARA QUEM TEM PERMISSÃO) */}
      {allowedSectores.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
          <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1">
            <Filter className="size-3.5" /> Setor:
          </span>
          {allowedSectores.map((setor) => (
            <button
              key={setor}
              type="button"
              onClick={() => setSelectedSetor(setor)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedSetor === setor
                  ? "bg-primary text-white shadow-md shadow-primary/20 scale-105"
                  : "bg-white dark:bg-card text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200/60 dark:border-white/5"
              }`}
            >
              {setor}
            </button>
          ))}
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL: MODO CONFERÊNCIA */}
      {activeTab === "conferencia" && (
        <div className="space-y-6">
          {!selectedEspetaculo ? (
            <Card className="p-16 text-center border-dashed border-2 rounded-3xl bg-transparent">
              <Music className="size-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-extrabold text-lg text-slate-700 dark:text-slate-200">
                Selecione um Espetáculo
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Escolha o espetáculo no menu acima para começar a conferência do seu checklist de {selectedSetor}.
              </p>
            </Card>
          ) : !selectedEventoId ? (
            <Card className="p-16 text-center border-dashed border-2 rounded-3xl bg-transparent">
              <Calendar className="size-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-extrabold text-lg text-slate-700 dark:text-slate-200">
                Selecione a Apresentação
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Selecione a data ou cidade do evento no segundo campo acima para carregar a prancheta de {selectedSetor}.
              </p>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm bg-white dark:bg-card/70 dark:backdrop-blur-xl rounded-3xl p-6 sm:p-8 space-y-6">
              
              {/* STATUS BAR DO EVENTO */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-white/5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xl text-slate-800 dark:text-white">
                      {eventoSelecionadoObj?.cidade}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-primary/10 text-primary">
                      {selectedSetor}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {eventoSelecionadoObj?.local || "Local a definir"} • {eventoSelecionadoObj?.data?.split('-').reverse().join('/')}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleImportarPadrao}
                    disabled={loading}
                    className="rounded-xl font-bold text-xs h-10 border-slate-200 dark:border-white/10"
                  >
                    <Play className="size-3.5 mr-1.5 text-primary" /> Importar Padrão de {selectedSetor}
                  </Button>
                </div>
              </div>

              {/* PROGRESSO */}
              {displayedItensEvento.length > 0 && (
                <div className="space-y-2 bg-slate-50 dark:bg-white/[0.02] p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-500">Progresso do Setor:</span>
                    <span className="text-primary font-black">{concluidosCount} de {displayedItensEvento.length} concluídos ({progresso}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${progresso === 100 ? 'bg-emerald-500' : 'bg-primary'}`} 
                      style={{ width: `${progresso}%` }}
                    />
                  </div>
                </div>
              )}

              {/* LISTA DE ITENS */}
              {displayedItensEvento.length === 0 ? (
                <div className="py-12 text-center border-dashed border-2 rounded-2xl">
                  <ListTodo className="size-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-sm text-slate-700 dark:text-slate-300">Nenhum item importado para {selectedSetor}.</p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">Clique no botão abaixo para carregar o modelo padrão gravado.</p>
                  <Button size="sm" onClick={handleImportarPadrao} className="rounded-xl font-bold text-xs">
                    <Play className="size-3.5 mr-1.5" /> Carregar Checklist Padrão
                  </Button>
                </div>
              ) : (
                <div className="grid gap-2.5">
                  {displayedItensEvento.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleConcluido(item.id, item.concluido)}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                        item.concluido
                          ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-slate-500"
                          : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-white/5 hover:border-primary/50 text-slate-800 dark:text-white shadow-xs"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {item.concluido ? (
                          <CheckCircle2 className="size-5.5 text-emerald-500 shrink-0" />
                        ) : (
                          <Circle className="size-5.5 text-slate-300 hover:text-primary shrink-0 transition-colors" />
                        )}
                        <span className={`text-sm font-semibold truncate ${item.concluido ? "line-through text-slate-400" : ""}`}>
                          {item.item_nome}
                        </span>
                        {item.obrigatorio && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 shrink-0">
                            Obrigatório
                          </span>
                        )}
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveItemEvento(item.id);
                        }}
                        className="size-8 text-slate-400 hover:text-red-500 rounded-lg shrink-0"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* ADICIONAR ITEM AVULSO */}
              <form onSubmit={handleAddExtraEvento} className="pt-4 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500">Adicionar Item Avulso neste Evento</Label>
                  <Input
                    placeholder="Ex: Pegar microfone backup na van..."
                    value={novoItemExtraNome}
                    onChange={(e) => setNovoItemExtraNome(e.target.value)}
                    className="h-10 rounded-xl bg-slate-50 dark:bg-slate-900 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <Switch checked={novoItemExtraObrigatorio} onCheckedChange={setNovoItemExtraObrigatorio} />
                  <span className="text-xs font-bold text-slate-500">Obrigatório</span>
                </div>
                <Button type="submit" variant="secondary" className="h-10 rounded-xl font-bold text-xs shrink-0">
                  <Plus className="size-4 mr-1" /> Incluir
                </Button>
              </form>

            </Card>
          )}
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL: MODO DEFINIR PADRÕES */}
      {activeTab === "configuracao" && (
        <Card className="border-0 shadow-sm bg-white dark:bg-card/70 dark:backdrop-blur-xl rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-white/5">
            <div>
              <h3 className="font-black text-xl text-slate-800 dark:text-white flex items-center gap-2">
                Padrões de {selectedSetor} {selectedEspetaculo ? `• ${selectedEspetaculo}` : ""}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Estes são os itens base que a sua função carrega automaticamente toda vez que for para uma nova praça.
              </p>
            </div>
          </div>

          {!selectedEspetaculo ? (
            <div className="py-12 text-center border-dashed border-2 rounded-2xl">
              <Music className="size-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-sm text-slate-700 dark:text-slate-300">Selecione o Espetáculo no menu superior</p>
              <p className="text-xs text-slate-400 mt-1">Cada show possui o seu próprio checklist de padrões.</p>
            </div>
          ) : (
            <>
              {/* LISTA DE PADRÕES */}
              {displayedItensPadrao.length === 0 ? (
                <div className="py-10 text-center border-dashed border-2 rounded-2xl">
                  <p className="font-bold text-sm text-slate-700 dark:text-slate-300">Nenhum item padrão cadastrado ainda para {selectedSetor}.</p>
                  <p className="text-xs text-slate-400 mt-1">Use o formulário abaixo para cadastrar os passos que você sempre faz!</p>
                </div>
              ) : (
                <div className="grid gap-2.5">
                  {displayedItensPadrao.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="size-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">
                          {item.item_nome}
                        </span>
                        {item.obrigatorio && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 shrink-0">
                            Obrigatório
                          </span>
                        )}
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemovePadrao(item.id)}
                        className="size-8 text-slate-400 hover:text-red-500 rounded-lg shrink-0"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* FORMULÁRIO NOVO ITEM PADRÃO */}
              <form onSubmit={handleAddPadrao} className="pt-4 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500">Novo Item Padrão para {selectedSetor}</Label>
                  <Input
                    placeholder="Ex: Checar baterias de microfones sem fio / passar figurinos..."
                    value={novoItemNome}
                    onChange={(e) => setNovoItemNome(e.target.value)}
                    className="h-10 rounded-xl bg-slate-50 dark:bg-slate-900 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <Switch checked={novoItemObrigatorio} onCheckedChange={setNovoItemObrigatorio} />
                  <span className="text-xs font-bold text-slate-500">Obrigatório</span>
                </div>
                <Button type="submit" className="h-10 rounded-xl font-bold text-xs shrink-0">
                  <Plus className="size-4 mr-1" /> Salvar no Padrão
                </Button>
              </form>
            </>
          )}
        </Card>
      )}

    </div>
  );
}
