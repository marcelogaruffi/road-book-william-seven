import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Mic2, ArrowLeft, Calendar, MapPin, Save, Ticket, Plus, Trash2, ListChecks, FileUp } from 'lucide-react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/som/$evento_id')({
  head: () => ({ meta: [{ title: 'Editar Mapa de Som' }] }),
  component: MapaSomForm,
});

function MapaSomForm() {
  const { evento_id } = Route.useParams();
  const navigate = useNavigate();
  const [mapa, setMapa] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [eventoData, setEventoData] = useState<any>(null);

  // Helper para atualizar campos no json_data
  const updateJson = (key: string, value: any) => {
    setMapa((prev: any) => ({
      ...prev,
      json_data: {
        ...prev.json_data,
        [key]: value
      }
    }));
  };

  useEffect(() => {
    loadData();
  }, [evento_id]);


  const addSomInputList = () => {
    const list = mapa?.json_data?.input_list_tabela || [];
    const proximoCanal = (list.length + 1).toString();
    updateJson('input_list_tabela', [...list, { id: Math.random().toString(36).substring(2, 9), canal: proximoCanal, equipamento: '', obs: '' }]);
  };

  const removeSomInputList = (id: string) => {
    const list = (mapa?.json_data?.input_list_tabela || []).filter((e: any) => e.id !== id);
    updateJson('input_list_tabela', list);
  };

  const updateSomInputList = (id: string, field: string, value: string) => {
    const list = (mapa?.json_data?.input_list_tabela || []).map((e: any) => 
      e.id === id ? { ...e, [field]: value } : e
    );
    updateJson('input_list_tabela', list);
  };

  const addEquipamento = () => {
    const list = mapa?.json_data?.equipamentos_lista || [];
    updateJson('equipamentos_lista', [...list, { id: Math.random().toString(36).substring(2, 9), qtd: '1', nome: '', detalhes: '' }]);
  };

  const removeEquipamento = (id: string) => {
    const list = (mapa?.json_data?.equipamentos_lista || []).filter((e: any) => e.id !== id);
    updateJson('equipamentos_lista', list);
  };

  const updateEquipamento = (id: string, field: string, value: string) => {
    const list = (mapa?.json_data?.equipamentos_lista || []).map((e: any) => 
      e.id === id ? { ...e, [field]: value } : e
    );
    updateJson('equipamentos_lista', list);
  };

  const addCue = () => {
    const list = mapa?.json_data?.cues_lista || [];
    updateJson('cues_lista', [...list, { id: Math.random().toString(36).substring(2, 9), faixa: '', nome_faixa: '', duracao: '', cena: '', deixa_prep: '', deixa_go: '' }]);
  };

  const removeCue = (id: string) => {
    const list = (mapa?.json_data?.cues_lista || []).filter((e: any) => e.id !== id);
    updateJson('cues_lista', list);
  };

  const updateCue = (id: string, field: string, value: string) => {
    const list = (mapa?.json_data?.cues_lista || []).map((e: any) => 
      e.id === id ? { ...e, [field]: value } : e
    );
    updateJson('cues_lista', list);
  };

  const loadData = async () => {
    setLoading(true);
    const [mapaRes, evRes] = await Promise.all([
      supabase.from('mapas_som').select('*').eq('evento_id', evento_id).single(),
      supabase.from('eventos').select('*').eq('id', evento_id).single()
    ]);
    if (mapaRes.data) {
      if (!mapaRes.data.json_data) mapaRes.data.json_data = {};
      setMapa(mapaRes.data);
    }
    if (evRes.data) {
      setEventoData(evRes.data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('mapas_som').update({
      json_data: mapa.json_data
    }).eq('id', mapa.id);

    setSaving(false);
    if (error) {
      toast.error('Erro ao salvar mapa');
    } else {
      toast.success('Mapa de som salvo com sucesso!');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!mapa) {
    return <div className="p-8 text-center">Mapa não encontrado.</div>;
  }

  const jd = mapa.json_data || {};

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/som' })} className="rounded-full">
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Rider Técnico de Som</h1>
          <p className="text-slate-500 font-medium">Preencha as configurações de áudio do espetáculo</p>
        </div>
      </div>

      <Card className="border-0 shadow-lg dark:bg-card/80 overflow-hidden rounded-3xl">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-6 text-white">
          <div className="flex items-center gap-3 mb-4 opacity-90">
            <Mic2 className="size-6" />
            <h2 className="text-xl font-bold">Informações do Evento</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-black/10 rounded-xl p-4">
              <div className="text-white/70 text-sm font-medium mb-1 flex items-center gap-2"><Ticket className="size-4"/> Espetáculo</div>
              <div className="font-bold text-lg">{mapa.espetaculo}</div>
            </div>
            <div className="bg-black/10 rounded-xl p-4">
              <div className="text-white/70 text-sm font-medium mb-1 flex items-center gap-2"><MapPin className="size-4"/> Cidade</div>
              <div className="font-bold text-lg">{mapa.cidade}</div>
            </div>
            <div className="bg-black/10 rounded-xl p-4">
              <div className="text-white/70 text-sm font-medium mb-1 flex items-center gap-2"><Calendar className="size-4"/> Data</div>
              <div className="font-bold text-lg">{mapa.data_apresentacao ? new Date(mapa.data_apresentacao + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}</div>
            </div>
          </div>
        </div>

        <CardContent className="p-8">
          <Accordion type="single" collapsible className="w-full space-y-4" defaultValue="bloco-a">
            
            <AccordionItem value="bloco-a" className="border border-slate-200 dark:border-white/10 rounded-xl px-4 bg-slate-50/50 dark:bg-black/20 data-[state=open]:bg-white dark:data-[state=open]:bg-white/5 transition-all">
              <AccordionTrigger className="text-lg font-bold hover:no-underline">Bloco A: Rider Local e Notas Gerais</AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4 pb-6">
                <div className="space-y-2">
                  <Label>Sistema de P.A. do Local</Label>
                  <Input value={jd.sistema_pa || ''} onChange={e => updateJson('sistema_pa', e.target.value)} placeholder="Ex: Line Array d&b audiotechnik, 8 caixas por lado" />
                </div>
                {eventoData?.rider_som_local && (
                  <div className="pt-2">
                    <Button variant="outline" className="w-full sm:w-auto bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200" asChild>
                      <a href={eventoData.rider_som_local} target="_blank" rel="noreferrer">
                        Ver Rider de Som do Local
                      </a>
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mesa de Som (FOH)</Label>
                    <Input value={jd.mesa_foh || ''} onChange={e => updateJson('mesa_foh', e.target.value)} placeholder="Ex: Yamaha CL5, DiGiCo SD9..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Mesa de Monitor (Palco)</Label>
                    <Input value={jd.mesa_monitor || ''} onChange={e => updateJson('mesa_monitor', e.target.value)} placeholder="Ex: Allen&Heath SQ6, ou 'feita do P.A.'" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="bloco-b" className="border border-slate-200 dark:border-white/10 rounded-xl px-4 bg-slate-50/50 dark:bg-black/20 data-[state=open]:bg-white dark:data-[state=open]:bg-white/5 transition-all">
              <AccordionTrigger className="text-lg font-bold hover:no-underline">Bloco B: Input List e Monitoração</AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4 pb-6">
                
                <div className="space-y-2">
                  <Label>Input List (Canais de Entrada)</Label>
                  <Textarea value={jd.input_list || ''} onChange={e => updateJson('input_list', e.target.value)} placeholder="Copie e cole ou liste os canais. Ex:&#10;CH 1 - Bumbo (Shure Beta 52)&#10;CH 2 - Caixa (Shure SM57)..." className="min-h-[150px] font-mono text-sm" />
                </div>

                <div className="space-y-2">
                  <Label>Necessidades de Monitoração</Label>
                  <Textarea value={jd.monitoracao || ''} onChange={e => updateJson('monitoracao', e.target.value)} placeholder="Ex: 4 vias de In-Ear, 2 cunhas para o tecladista, 1 side fill..." className="min-h-[80px]" />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="bloco-c" className="border border-slate-200 dark:border-white/10 rounded-xl px-4 bg-slate-50/50 dark:bg-black/20 data-[state=open]:bg-white dark:data-[state=open]:bg-white/5 transition-all">
              <AccordionTrigger className="text-lg font-bold hover:no-underline">Bloco C: Necessidades Extras e RF</AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4 pb-6">
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                      <ListChecks className="size-5 text-blue-500" />
                      Lista de Equipamentos Necessários
                    </Label>
                    <Button type="button" onClick={addEquipamento} size="sm" className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:hover:bg-blue-500/30">
                      <Plus className="size-4 mr-2" />
                      Adicionar Linha
                    </Button>
                  </div>
                  <p className="text-sm text-slate-500">Liste abaixo tudo que a produção local precisa providenciar (locação) ou que é indispensável na casa.</p>
                  
                  <div className="space-y-3">
                    {(jd.equipamentos_lista || []).length === 0 ? (
                      <div className="text-center p-6 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl text-slate-500">
                        Nenhum equipamento listado ainda.
                      </div>
                    ) : (
                      (jd.equipamentos_lista || []).map((eq: any) => (
                        <div key={eq.id} className="flex flex-col sm:flex-row gap-3 p-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl items-start sm:items-center">
                          <div className="w-full sm:w-20">
                            <Label className="sm:hidden text-xs text-slate-500 mb-1 block">Qtd</Label>
                            <Input 
                              value={eq.qtd} 
                              onChange={e => updateEquipamento(eq.id, 'qtd', e.target.value)} 
                              placeholder="Qtd" 
                              className="bg-white dark:bg-black/50 text-center"
                            />
                          </div>
                          <div className="w-full sm:flex-1">
                            <Label className="sm:hidden text-xs text-slate-500 mb-1 block">Equipamento</Label>
                            <Input 
                              value={eq.nome} 
                              onChange={e => updateEquipamento(eq.id, 'nome', e.target.value)} 
                              placeholder="Ex: Microfone Sem Fio, Pedestal, Cabo AC..." 
                              className="bg-white dark:bg-black/50 font-medium"
                            />
                          </div>
                          <div className="w-full sm:flex-1">
                            <Label className="sm:hidden text-xs text-slate-500 mb-1 block">Detalhes / Marca</Label>
                            <Input 
                              value={eq.detalhes} 
                              onChange={e => updateEquipamento(eq.id, 'detalhes', e.target.value)} 
                              placeholder="Ex: Shure SM58, Bivolt, etc" 
                              className="bg-white dark:bg-black/50 text-slate-600 dark:text-slate-300"
                            />
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeEquipamento(eq.id)} 
                            className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0 self-end sm:self-auto"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Anotações de Radiofrequência (RF)</Label>
                  <Input value={jd.rf_notas || ''} onChange={e => updateJson('rf_notas', e.target.value)} placeholder="Ex: Faixas 600-650MHz congestionadas na região" />
                </div>

                <div className="space-y-3 p-4 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/10">
                  <Label className="font-bold flex items-center gap-2">
                    <Mic2 className="size-4 text-blue-500" />
                    Arquivo da Cena (Console) e Rider PDF
                  </Label>

                  <div className="space-y-2 pb-2">
                    <Label className="text-xs text-slate-500">Descrição do arquivo (Ex: Input List PDF, Cena DiGiCo)</Label>
                    <Input 
                      value={jd.arquivo_descricao || ''} 
                      onChange={e => updateJson('arquivo_descricao', e.target.value)} 
                      placeholder="Qual é esse arquivo?" 
                      className="bg-white dark:bg-card"
                    />
                  </div>

                  {jd.arquivo_url && (
                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-card rounded-lg border border-slate-100 dark:border-white/5">
                      <div className="flex-1 truncate text-sm font-medium">
                        {jd.arquivo_nome || "Arquivo Anexado"}
                        {jd.arquivo_descricao && <span className="text-slate-500 font-normal ml-2">({jd.arquivo_descricao})</span>}
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={jd.arquivo_url} target="_blank" rel="noreferrer">Baixar</a>
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => {
                        updateJson('arquivo_url', null);
                        updateJson('arquivo_nome', null);
                      }}>Remover</Button>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <Input 
                      type="file" 
                      className="cursor-pointer bg-white dark:bg-card"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        const toastId = toast.loading('Fazendo upload...');
                        try {
                          const fileExt = file.name.split('.').pop();
                          const fileName = `${evento_id}_som_${Math.random()}.${fileExt}`;
                          const { data, error } = await supabase.storage.from('documentos_tecnicos').upload(fileName, file);
                          
                          if (error) throw error;
                          
                          const { data: urlData } = supabase.storage.from('documentos_tecnicos').getPublicUrl(fileName);
                          
                          updateJson('arquivo_url', urlData.publicUrl);
                          updateJson('arquivo_nome', file.name);
                          toast.success('Upload concluído!', { id: toastId });
                        } catch (err: any) {
                          toast.error(`Erro no upload: ${getErrorMessage(err)}`, { id: toastId });
                        }
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">O botão acima envia o arquivo instantaneamente. Lembre-se de clicar em "Salvar Mapa de Som" depois.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="bloco-d" className="border border-slate-200 dark:border-white/10 rounded-xl px-4 bg-slate-50/50 dark:bg-black/20 data-[state=open]:bg-white dark:data-[state=open]:bg-white/5 transition-all">
              <AccordionTrigger className="text-lg font-bold hover:no-underline">Bloco D: Deixas Musicais (Cues)</AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4 pb-6">
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                      <Music className="size-5 text-blue-500" />
                      Roteiro de Deixas e Faixas
                    </Label>
                    <Button type="button" onClick={addCue} size="sm" className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:hover:bg-blue-500/30">
                      <Plus className="size-4 mr-2" />
                      Adicionar Deixa
                    </Button>
                  </div>
                  <p className="text-sm text-slate-500">Registre as deixas de preparação e do GO para soltar as faixas de áudio.</p>
                  
                  <div className="space-y-3">
                    {(jd.cues_lista || []).length === 0 ? (
                      <div className="text-center p-6 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl text-slate-500">
                        Nenhuma deixa musical cadastrada.
                      </div>
                    ) : (
                      (jd.cues_lista || []).map((cue: any) => (
                        <div key={cue.id} className="flex flex-col gap-3 p-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl">
                          <div className="flex flex-col sm:flex-row gap-3">
                            <div className="w-full sm:w-24">
                              <Label className="text-xs text-slate-500 mb-1 block">Faixa Nº</Label>
                              <Input 
                                value={cue.faixa} 
                                onChange={e => updateCue(cue.id, 'faixa', e.target.value)} 
                                placeholder="Ex: 01" 
                                className="bg-white dark:bg-black/50 text-center font-bold"
                              />
                            </div>
                            <div className="w-full sm:flex-1">
                              <Label className="text-xs text-slate-500 mb-1 block">Nome da Faixa</Label>
                              <Input 
                                value={cue.nome_faixa} 
                                onChange={e => updateCue(cue.id, 'nome_faixa', e.target.value)} 
                                placeholder="Ex: Abertura / Intro" 
                                className="bg-white dark:bg-black/50 font-medium"
                              />
                            </div>
                            <div className="w-full sm:w-24">
                              <Label className="text-xs text-slate-500 mb-1 block">Duração</Label>
                              <Input 
                                value={cue.duracao} 
                                onChange={e => updateCue(cue.id, 'duracao', e.target.value)} 
                                placeholder="Ex: 3:45" 
                                className="bg-white dark:bg-black/50 text-center"
                              />
                            </div>
                            <div className="w-full sm:w-32">
                              <Label className="text-xs text-slate-500 mb-1 block">Cena</Label>
                              <Input 
                                value={cue.cena} 
                                onChange={e => updateCue(cue.id, 'cena', e.target.value)} 
                                placeholder="Ex: Cena 1" 
                                className="bg-white dark:bg-black/50"
                              />
                            </div>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeCue(cue.id)} 
                              className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 sm:mt-6 shrink-0 self-end sm:self-auto"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row gap-3">
                            <div className="w-full sm:flex-1">
                              <Label className="text-xs text-slate-500 mb-1 block">Deixa de Preparação (Standby)</Label>
                              <Textarea 
                                value={cue.deixa_prep} 
                                onChange={e => updateCue(cue.id, 'deixa_prep', e.target.value)} 
                                placeholder="Ex: Ator entra pelo lado esquerdo do palco" 
                                className="bg-white dark:bg-black/50 min-h-[60px]"
                              />
                            </div>
                            <div className="w-full sm:flex-1">
                              <Label className="text-xs text-slate-500 mb-1 block">Deixa do GO</Label>
                              <Textarea 
                                value={cue.deixa_go} 
                                onChange={e => updateCue(cue.id, 'deixa_go', e.target.value)} 
                                placeholder="Ex: Fala: 'Está na hora de ir!'" 
                                className="bg-white dark:bg-black/50 min-h-[60px]"
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex justify-end pt-8">
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 px-10 rounded-xl shadow-lg hover:shadow-xl transition-all">
              <Save className="size-5 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Mapa de Som'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
