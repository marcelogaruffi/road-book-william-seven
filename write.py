import os
with open('src/routes/_authenticated/malas.$evento_id.tsx', 'w', encoding='utf-8') as f:
    f.write("""import { createFileRoute, Link } from '@tanstack/react-router';
import { MalasTemplateTab } from "@/components/MalasTemplateTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Check, ChevronLeft, Luggage, Save, ShieldAlert, FileWarning, Plus, Trash2, Eraser, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';
import type { MalaVolume, MalaItem } from '@/components/MalasTemplateTab';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const Route = createFileRoute('/_authenticated/malas/$evento_id')({
  component: () => <ErrorBoundary><MalasEventoOperacao /></ErrorBoundary>,
});

function MalasEventoOperacao() {
  const { evento_id } = Route.useParams();
  const [evento, setEvento] = useState<any>(null);
  const [roadbook, setRoadbook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [volumesIda, setVolumesIda] = useState<(MalaVolume & { itens: (MalaItem & { checked?: boolean })[] })[]>([]);
  const [volumesVolta, setVolumesVolta] = useState<(MalaVolume & { itens: (MalaItem & { checked?: boolean })[] })[]>([]);
  const [fase, setFase] = useState<'ida' | 'volta'>('ida');

  const volumes = fase === 'ida' ? volumesIda : volumesVolta;
  const setVolumes = fase === 'ida' ? setVolumesIda : setVolumesVolta;

  useEffect(() => {
    loadData();
  }, [evento_id]);

  async function loadData() {
    setLoading(true);
    const { data: evData } = await supabase.from('eventos').select('*').eq('id', evento_id).single();
    if (evData) setEvento(evData);

    const { data: rbData } = await supabase.from('roadbooks').select('*').eq('evento_id', evento_id).maybeSingle();
    
    if (rbData) {
      setRoadbook(rbData);
      const autos = rbData.automacoes || {};
      
      let padrao = [];
      if (evData) {
        const { data: tData } = await supabase.from('templates_espetaculos').select('assets_midia').eq('nome_espetaculo', evData.espetaculo).maybeSingle();
        if (tData && tData.assets_midia?.malas_padrao) padrao = tData.assets_midia.malas_padrao;
      }

      const savedIda = autos.operacao_malas_ida || autos.operacao_malas || [];
      const savedVolta = autos.operacao_malas_volta || [];

      if (savedIda.length > 0) {
        setVolumesIda(savedIda);
      } else if (padrao.length > 0) {
        setVolumesIda(padrao.map((v: any) => ({ ...v, itens: (v.itens || []).map((i: any) => ({ ...i, checked: false })) })));
      }

      if (savedVolta.length > 0) {
        setVolumesVolta(savedVolta);
      } else if (savedIda.length > 0) {
        setVolumesVolta(savedIda.map((v: any) => ({ ...v, itens: (v.itens || []).map((i: any) => ({ ...i, checked: false })) })));
      } else if (padrao.length > 0) {
        setVolumesVolta(padrao.map((v: any) => ({ ...v, itens: (v.itens || []).map((i: any) => ({ ...i, checked: false })) })));
      }
    }
    setLoading(false);
  }

  async function saveChecklist() {
    if (!roadbook) return;
    setSaving(true);
    
    const autos = roadbook.automacoes || {};
    const payload = {
      ...autos,
      operacao_malas_ida: volumesIda,
      operacao_malas_volta: volumesVolta,
      operacao_malas: null 
    };

    const { error } = await supabase.from('roadbooks').update({ automacoes: payload }).eq('id', roadbook.id);
    setSaving(false);
    if (error) {
      toast.error('Erro ao salvar: ' + getErrorMessage(error));
    } else {
      toast.success('Checklist salvo com sucesso!');
      setRoadbook({ ...roadbook, automacoes: payload });
    }
  }

  function handleClearChecklist() {
    if (!confirm(`Tem certeza que deseja limpar TODAS as marcações da ${fase.toUpperCase()}?`)) return;
    setVolumes((prev: any) => prev.map((v: any) => ({
      ...v,
      itens: (v.itens || []).map((i: any) => ({ ...i, checked: false }))
    })));
    toast.info("Lembre-se de clicar em 'Salvar Checklist' no topo da página!");
  }

  function toggleItem(volId: string, itemId: string, checked: boolean) {
    setVolumes((prev: any) => prev.map((v: any) => {
      if (v.id === volId) {
        return {
          ...v,
          itens: (v.itens || []).map((i: any) => i.id === itemId ? { ...i, checked } : i)
        };
      }
      return v;
    }));
  }

  function handleAddExtraVolume() {
    const nome = prompt("Digite o nome da nova mala (Ex: 'Mala Extra Produção'):");
    if (!nome) return;
    
    setVolumes((prev: any) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        nome,
        itens: []
      }
    ]);
    toast.info("Lembre-se de clicar em 'Salvar Checklist' no topo da página!");
  }

  function handleAddExtraItem(volId: string) {
    const nome = prompt("Digite o nome do novo item para esta mala (Ex: 'Extensão 10m'):");
    if (!nome) return;
    const qtyStr = prompt("Quantidade:", "1");
    const qty = parseInt(qtyStr || "1", 10) || 1;

    setVolumes((prev: any) => prev.map((v: any) => {
      if (v.id === volId) {
        return {
          ...v,
          itens: [
            ...(v.itens || []),
            { id: Math.random().toString(36).substring(2, 9), nome, quantidade: qty, checked: false }
          ]
        };
      }
      return v;
    }));
    toast.info("Lembre-se de clicar em 'Salvar Checklist' no topo da página!");
  }

  function handleDeleteItem(volId: string, itemId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Remover este item do checklist DESSA CIDADE? (Não altera as outras cidades)")) return;
    setVolumes((prev: any) => prev.map((v: any) => {
      if (v.id === volId) {
        return { ...v, itens: (v.itens || []).filter((i: any) => i.id !== itemId) };
      }
      return v;
    }));
  }

  const totalItens = volumes.reduce((acc, vol) => acc + (vol.itens?.length || 0), 0);
  const checkedItens = volumes.reduce((acc, vol) => acc + (vol.itens?.filter((i: any) => i.checked)?.length || 0), 0);
  const progress = totalItens === 0 ? 0 : Math.round((checkedItens / totalItens) * 100);
  const allChecked = totalItens > 0 && checkedItens === totalItens;

  if (loading) return <div className="p-12 text-center">Carregando checklist de malas...</div>;

  return (
    <>
      <div className="w-full px-2 md:px-6 max-w-4xl mx-auto mb-6 mt-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" asChild className="text-slate-500 hover:text-slate-800 dark:hover:text-white">
            <Link to="/malas"><ChevronLeft className="size-4 mr-2" /> Voltar</Link>
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleClearChecklist} className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/30 dark:hover:bg-red-950/30 rounded-xl h-11 px-4">
              <Eraser className="size-4 mr-2" /> Limpar Checklist
            </Button>
            <Button onClick={saveChecklist} disabled={saving} className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 rounded-xl font-bold h-11 px-6 shadow-md">
              <Save className="size-4 mr-2" /> {saving ? 'Salvando...' : 'Salvar Checklist'}
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="evento" className="w-full px-2 md:px-6 py-6 max-w-6xl mx-auto">
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-slate-100 dark:bg-white/10 rounded-xl h-14 p-1 mb-6 mx-auto">
          <TabsTrigger value="evento" className="rounded-lg h-full font-bold">Mapa do Evento</TabsTrigger>
          <TabsTrigger value="modelos" className="rounded-lg h-full font-bold">Modelos (Padrão)</TabsTrigger>
        </TabsList>
        <TabsContent value="evento" className="mt-0">
          <div className="max-w-4xl mx-auto space-y-6 pb-20">
      
            <div className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-800 dark:to-slate-900 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
              <Luggage className="absolute -right-10 -bottom-10 size-64 text-white/5 rotate-12" />
              <div className="relative z-10 space-y-2">
                <Badge className="bg-white/20 text-white hover:bg-white/30 border-none mb-2">
                  {evento?.cidade} • {evento?.data ? new Date(evento.data + 'T12:00:00').toLocaleDateString('pt-BR') : ''}
                </Badge>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                  Operação de Malas
                </h1>
                <p className="text-slate-300 font-medium text-lg">
                  {evento?.espetaculo}
                </p>
              </div>
            </div>

            <div className="flex bg-slate-100 dark:bg-white/5 rounded-2xl p-1 shadow-inner max-w-sm mx-auto my-8">
              <button onClick={() => setFase('ida')} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all ${fase === 'ida' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                <ArrowRight className="size-4" /> Montagem de Ida
              </button>
              <button onClick={() => setFase('volta')} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all ${fase === 'volta' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                <ArrowLeft className="size-4" /> Montagem de Volta
              </button>
            </div>

            {volumes.length === 0 ? (
              <Card className="border-0 shadow-md rounded-2xl bg-white dark:bg-card">
                <CardContent className="p-12 text-center text-slate-500 space-y-4">
                  <Luggage className="size-16 mx-auto opacity-20" />
                  <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">Nenhuma mala configurada</h3>
                  <p>O espetáculo <strong>{evento?.espetaculo}</strong> não possui malas padrão cadastradas.</p>
                  <Button asChild variant="outline" className="mt-4 rounded-xl">
                    <Link to="/malas">Configurar Malas Padrão</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4 bg-white dark:bg-card p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 transition-colors">
                  <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                  </div>
                  <span className="font-bold text-slate-600 dark:text-slate-300">{progress}%</span>
                </div>
      
                {allChecked && (
                  <div className="bg-indigo-50 border border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 p-4 rounded-2xl flex items-center font-bold">
                    <Check className="size-5 mr-3" /> Todas as malas da {fase.toUpperCase()} foram conferidas com sucesso!
                  </div>
                )}
      
                <div className="grid gap-6">
                  {volumes.map((vol, vIdx) => {
                    const itens = vol.itens || [];
                    const volProgress = itens.length > 0 
                      ? Math.round((itens.filter(i => i.checked).length / itens.length) * 100)
                      : 0;
                    const isVolComplete = volProgress === 100;
      
                    return (
                      <Card key={vol.id} className={`border-0 shadow-md rounded-2xl transition-colors ${isVolComplete ? 'bg-indigo-50/30 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-900/30' : 'bg-white dark:bg-card'}`}>
                        <CardHeader className={`sticky top-0 z-10 rounded-t-2xl border-b border-slate-100 dark:border-white/5 pb-4 flex flex-row items-center justify-between transition-colors backdrop-blur-xl ${isVolComplete ? 'bg-indigo-100/95 dark:bg-indigo-900/95' : 'bg-white/95 dark:bg-slate-900/95'}`}>
                          <div>
                            <CardTitle className="text-xl flex items-center gap-2">
                              {isVolComplete ? <Check className="text-indigo-500 size-5" /> : <Luggage className="text-slate-400 size-5" />}
                              {vol.nome}
                            </CardTitle>
                          </div>
                          <div className="flex items-center gap-3">
                            <Button variant="outline" size="sm" onClick={() => handleAddExtraItem(vol.id)} className="h-8 text-xs border-slate-200 dark:border-white/10 dark:bg-black/20">
                              <Plus className="size-3 mr-1" /> Adicionar
                            </Button>
                            <Badge variant="outline" className={isVolComplete ? 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800' : ''}>
                              {itens.filter(i => i.checked).length} / {itens.length} itens ({volProgress}%)
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="divide-y divide-slate-100 dark:divide-white/5">
                            {itens.map((item: any) => (
                              <label key={item.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                                <Checkbox 
                                  checked={item.checked} 
                                  onCheckedChange={(c) => toggleItem(vol.id, item.id, !!c)}
                                  data-item-id={item.id}
                                  data-malas-checkbox="true"
                                  className="size-6 rounded-md border-2 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                                />
                                <div className={`flex-1 font-medium text-lg transition-colors flex items-center gap-3 ${item.checked ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                                  {item.foto_url && (
                                    <a href={item.foto_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="shrink-0 group-hover:scale-110 transition-transform">
                                      <img src={item.foto_url} alt={item.nome} className="h-10 w-10 rounded-md object-cover border border-slate-200 dark:border-white/10" />
                                    </a>
                                  )}
                                  {item.nome}
                                </div>
                                <div className={`px-3 py-1 rounded-lg font-bold text-sm bg-slate-100 dark:bg-slate-800 ${item.checked ? 'opacity-50' : 'text-slate-600 dark:text-slate-300'}`}>
                                  {item.quantidade}x
                                </div>
                                <Button variant="ghost" size="icon" onClick={(e) => handleDeleteItem(vol.id, item.id, e)} className="size-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shrink-0">
                                  <Trash2 className="size-4" />
                                </Button>
                              </label>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                
                <div className="flex justify-center mt-8">
                  <Button onClick={handleAddExtraVolume} variant="outline" className="border-dashed border-2 border-slate-300 dark:border-slate-700 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 h-14 rounded-2xl px-8 shadow-none">
                    <Luggage className="size-5 mr-2" />
                    Adicionar Nova Mala (Volume Extra)
                  </Button>
                </div>
                
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="modelos" className="mt-0">
          <MalasTemplateTab />
        </TabsContent>
      </Tabs>
    </>
  );
}
"""
    )
