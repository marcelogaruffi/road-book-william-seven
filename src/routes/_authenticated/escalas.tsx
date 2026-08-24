// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, CalendarDays, User, Trash2, Lock, Check } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Route as AuthedRoute } from "./route";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_authenticated/escalas")({
  head: () => ({ meta: [{ title: "Gestão de Escalas - Seven Produções Artísticas" }] }),
  component: EscalasPage,
});

function EscalasPage() {
  const { profile } = AuthedRoute.useRouteContext();
  const [escalas, setEscalas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Lote states
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [eventosFuturos, setEventosFuturos] = useState<any[]>([]);
  const [selectedProf, setSelectedProf] = useState<string>("");
  const [selectedFuncao, setSelectedFuncao] = useState<string>("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [savingLote, setSavingLote] = useState(false);

  const allowedRoles = ['admin', 'dev', 'produtor'];
  if (profile && !allowedRoles.includes(profile.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <Lock className="size-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300">Acesso Restrito</h2>
        <p className="text-slate-500 mt-2">Esta página é exclusiva para Administradores e Produtores.</p>
      </div>
    );
  }

  const loadData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('evento_escalas')
      .select(`
        id,
        status,
        created_at,
        evento:evento_id(id, espetaculo, cidade, data),
        funcao,
        usuario:usuario_id(id, nome, role)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Erro ao buscar escalas: " + error.message);
    } else {
      setEscalas(data || []);
    }
    setLoading(false);
  };
  
  const loadLoteData = async () => {
    const { data: pData } = await supabase.from('profiles').select('id, nome, role, funcoes').in('role', ['admin', 'dev', 'produtor', 'motorista', 'tecnico_som', 'iluminador', 'elenco', 'stage_manager', 'contra_regra', 'assistente_producao', 'camareiro', 'musico', 'tour_manager', 'roadie', 'cenotecnico', 'tecnico_video', 'rigger']).order('nome');
    if (pData) setProfissionais(pData);
    
    const today = new Date().toISOString().split('T')[0];
    const { data: eData } = await supabase.from('eventos').select('id, espetaculo, cidade, data, equipe').gte('data', today).order('data', { ascending: true });
    if (eData) setEventosFuturos(eData);
  };

  useEffect(() => {
    loadData();
    loadLoteData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover esta escala?")) return;
    
    const esc = escalas.find(e => e.id === id);
    if (!esc) return;
    
    const { error } = await supabase.from('evento_escalas').delete().eq('id', id);
    if (error) {
      toast.error("Erro ao deletar: " + error.message);
    } else {
      if (esc.evento?.id && esc.usuario?.id) {
        const { data: evData } = await supabase.from('eventos').select('equipe').eq('id', esc.evento.id).single();
        if (evData && evData.equipe) {
          const novaEquipe = evData.equipe.filter((u: string) => u !== esc.usuario.id);
          await supabase.from('eventos').update({ equipe: novaEquipe }).eq('id', esc.evento.id);
        }
      }
      toast.success("Escala deletada com sucesso.");
      loadData();
    }
  };

  const handleAccept = async (id: string) => {
    if (!confirm("Confirmar a presença manualmente nesta escala?")) return;
    
    const { error } = await supabase.from('evento_escalas').update({ status: 'aceita' }).eq('id', id);
    if (error) {
      toast.error("Erro ao aceitar: " + error.message);
    } else {
      toast.success("Escala aceita manualmente!");
      loadData();
    }
  };

  const handleAcceptAll = async () => {
    const pendentes = escalas.filter(e => e.status === 'pendente');
    if (pendentes.length === 0) {
      toast.info("Não há escalas pendentes.");
      return;
    }
    if (!confirm(`Tem certeza que deseja aceitar manualmente todas as ${pendentes.length} escalas pendentes?`)) return;
    
    const ids = pendentes.map(e => e.id);
    
    // Supabase in() works great for bulk updates
    const { error } = await supabase.from('evento_escalas').update({ status: 'aceita' }).in('id', ids);
    if (error) {
      toast.error("Erro ao aceitar em lote: " + error.message);
    } else {
      toast.success(`${pendentes.length} escalas aceitas com sucesso!`);
      loadData();
    }
  };
  
  const handleProfChange = (e: any) => {
    const val = e.target.value;
    setSelectedProf(val);
    if (val && profissionais.length > 0) {
      const p = profissionais.find(x => x.id === val);
      if (p) setSelectedFuncao(p.role || '');
    }
  };

  const handleToggleEvent = (evId: string) => {
    setSelectedEvents(prev => prev.includes(evId) ? prev.filter(id => id !== evId) : [...prev, evId]);
  };
  
  const handleToggleAll = () => {
    if (selectedEvents.length === eventosFuturos.length) {
      setSelectedEvents([]);
    } else {
      setSelectedEvents(eventosFuturos.map(e => e.id));
    }
  };

  const handleSaveLote = async () => {
    if (!selectedProf || !selectedFuncao || selectedEvents.length === 0) {
      toast.warning("Selecione um profissional, a função e ao menos um evento.");
      return;
    }
    
    setSavingLote(true);
    let count = 0;
    
    for (const evId of selectedEvents) {
      const ev = eventosFuturos.find(e => e.id === evId);
      if (!ev) continue;
      
      const { data: escData } = await supabase.from('evento_escalas').select('id').eq('evento_id', evId).eq('usuario_id', selectedProf).maybeSingle();
      if (!escData) {
         await supabase.from('evento_escalas').insert({
            evento_id: evId,
            usuario_id: selectedProf,
            funcao: selectedFuncao,
            status: 'pendente'
         });
         
         const equipe = ev.equipe || [];
         if (!equipe.includes(selectedProf)) {
            await supabase.from('eventos').update({ equipe: [...equipe, selectedProf] }).eq('id', evId);
         }
         count++;
      }
    }
    
    toast.success(count + " escala(s) criadas com sucesso.");
    setSavingLote(false);
    setSelectedProf("");
    setSelectedFuncao("");
    setSelectedEvents([]);
    loadData();
    loadLoteData();
  };

  const filtered = escalas.filter(esc => {
    const term = searchTerm.toLowerCase();
    const eventName = (esc.evento?.espetaculo || '').toLowerCase();
    const city = (esc.evento?.cidade || '').toLowerCase();
    const userName = (esc.usuario?.nome || '').toLowerCase();
    return eventName.includes(term) || city.includes(term) || userName.includes(term) || esc.status.includes(term);
  });
  
  const selectedProfObj = profissionais.find(p => p.id === selectedProf);
  const availableFuncoes = selectedProfObj 
    ? Array.from(new Set([selectedProfObj.role, ...(selectedProfObj.funcoes || [])])).filter(Boolean).sort()
    : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Gestão de Escalas
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Acompanhe em tempo real ou escale profissionais em lote para eventos futuros.
          </p>
        </div>
      </div>

      <Tabs defaultValue="historico" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mb-6 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
          <TabsTrigger value="historico" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">Histórico e Status</TabsTrigger>
          <TabsTrigger value="lote" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">Escalação em Lote</TabsTrigger>
        </TabsList>
        
        <TabsContent value="historico" className="m-0">
          <Card className="shadow-lg border-slate-200/60 dark:border-white/10 rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/5 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input 
                    placeholder="Buscar por nome, evento ou status..." 
                    className="pl-9 bg-white dark:bg-black"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                {escalas.some(e => e.status === 'pendente') && (
                  <Button onClick={handleAcceptAll} className="bg-green-500 hover:bg-green-600 text-white font-bold shrink-0">
                    <Check className="size-4 mr-2" /> Aceitar Todas as Pendentes
                  </Button>
                )}
              </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-b dark:border-white/10">
                    <tr>
                      <th className="px-6 py-4 font-bold">Profissional</th>
                      <th className="px-6 py-4 font-bold">Evento & Local</th>
                      <th className="px-6 py-4 font-bold">Data</th>
                      <th className="px-6 py-4 font-bold">Status</th>
                      <th className="px-6 py-4 font-bold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Carregando escalas...</td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Nenhuma escala encontrada.</td>
                      </tr>
                    ) : (
                      filtered.map(esc => {
                        const statusColor = esc.status === 'aceita' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400' :
                                            esc.status === 'recusada' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400' :
                                            esc.status === 'pendente' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                            'bg-slate-100 text-slate-700 border-slate-200';
                        const statusLabel = esc.status === 'aceita' ? 'Aceita' :
                                            esc.status === 'recusada' ? 'Recusada' :
                                            esc.status === 'pendente' ? 'Pendente' :
                                            'Desconhecido';

                        return (
                          <tr key={esc.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                  <User className="size-4 text-slate-500" />
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white">{esc.usuario?.nome || 'Usuário Deletado'}</div>
                                  <div className="text-[10px] uppercase font-semibold text-slate-400">{(esc.funcao || esc.usuario?.role || 'N/A').replace('_', ' ')}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-semibold text-slate-700 dark:text-slate-300">{esc.evento?.espetaculo}</div>
                              <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="size-3" /> {esc.evento?.cidade}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                                <CalendarDays className="size-4 opacity-70" />
                                {esc.evento?.data ? format(new Date(esc.evento.data + 'T12:00:00Z'), "dd MMM, yyyy", { locale: ptBR }) : '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`border font-semibold ${statusColor}`}>
                                  {statusLabel}
                                </Badge>
                                {esc.status === 'pendente' && (
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleAccept(esc.id)}
                                    className="h-6 px-2 text-[10px] uppercase font-bold bg-green-500 hover:bg-green-600 text-white rounded-md shadow-sm"
                                    title="Dar Aceite Manualmente"
                                  >
                                    <Check className="size-3 mr-1" /> Aceitar
                                  </Button>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDelete(esc.id)}
                                className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                title="Deletar Escala"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="lote" className="m-0">
          <Card className="shadow-lg border-slate-200/60 dark:border-white/10 rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/5 pb-4">
              <CardTitle>Escalação em Lote</CardTitle>
              <CardDescription>Selecione um profissional e atribua-o rapidamente a vários eventos futuros de uma vez.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Profissional</label>
                  <select 
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background h-12"
                    value={selectedProf}
                    onChange={handleProfChange}
                  >
                    <option value="">Selecione o membro da equipe...</option>
                    {profissionais.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Função</label>
                  <select 
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background h-12"
                    value={selectedFuncao}
                    onChange={e => setSelectedFuncao(e.target.value)}
                  >
                    <option value="">Selecione a função...</option>
                    {availableFuncoes.map(f => (
                      <option key={f as string} value={f as string}>{(f as string).replace('_', ' ').toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Eventos Futuros ({eventosFuturos.length})</label>
                  <Button variant="ghost" size="sm" onClick={handleToggleAll} className="text-indigo-600 dark:text-indigo-400">
                    {selectedEvents.length === eventosFuturos.length ? "Desmarcar Todos" : "Selecionar Todos"}
                  </Button>
                </div>
                
                {eventosFuturos.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-500">
                    Não há eventos futuros cadastrados no sistema.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-2">
                    {eventosFuturos.map(ev => {
                      const isSelected = selectedEvents.includes(ev.id);
                      return (
                        <div 
                          key={ev.id} 
                          onClick={() => handleToggleEvent(ev.id)}
                          className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-200'}`}
                        >
                          <Checkbox checked={isSelected} className="mt-1" />
                          <div className="flex-1 min-w-0 pointer-events-none">
                            <div className="font-bold text-sm text-slate-800 dark:text-white truncate">{ev.espetaculo}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate">
                              <MapPin className="size-3 shrink-0" /> {ev.cidade}
                            </div>
                            <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1 mt-1">
                              <CalendarDays className="size-3 shrink-0" />
                              {format(new Date(ev.data + 'T12:00:00Z'), "dd/MM/yyyy")}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleSaveLote} 
                  disabled={savingLote || !selectedProf || !selectedFuncao || selectedEvents.length === 0}
                  className="h-12 px-8 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                >
                  {savingLote ? "Salvando..." : "Salvar Escalação em Lote"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
