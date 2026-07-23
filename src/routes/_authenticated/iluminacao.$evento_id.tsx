import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Lightbulb, ArrowLeft, Calendar, MapPin, Save, Ticket, Plus, Trash2, ListChecks } from 'lucide-react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/iluminacao/$evento_id')({
  head: () => ({ meta: [{ title: 'Editar Mapa de Luz' }] }),
  component: MapaLuzForm,
});

function MapaLuzForm() {
  const { evento_id } = Route.useParams();
  const navigate = useNavigate();
  const [mapa, setMapa] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const addEquipamento = () => {
    const list = mapa?.json_data?.equipamentos_lista || [];
    updateJson('equipamentos_lista', [...list, { id: crypto.randomUUID(), qtd: '1', nome: '', detalhes: '' }]);
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

  const loadData = async () => {
    setLoading(true);
    const { data } = await supabase.from('mapas_luz').select('*').eq('evento_id', evento_id).single();
    if (data) {
      if (!data.json_data) data.json_data = {};
      setMapa(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('mapas_luz').update({
      json_data: mapa.json_data
    }).eq('id', mapa.id);

    setSaving(false);
    if (error) {
      toast.error('Erro ao salvar mapa');
    } else {
      toast.success('Mapa de luz salvo com sucesso!');
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
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/iluminacao' })} className="rounded-full">
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Mapa de Luz</h1>
          <p className="text-slate-500 font-medium">Preencha as configurações técnicas do espetáculo</p>
        </div>
      </div>

      <Card className="border-0 shadow-lg dark:bg-card/80 overflow-hidden rounded-3xl">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
          <div className="flex items-center gap-3 mb-4 opacity-90">
            <Lightbulb className="size-6" />
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
              <AccordionTrigger className="text-lg font-bold hover:no-underline">Bloco A: Infraestrutura do Palco e Energia</AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Boca de Cena (m)</Label>
                    <Input value={jd.boca_cena || ''} onChange={e => updateJson('boca_cena', e.target.value)} placeholder="Ex: 12m" />
                  </div>
                  <div className="space-y-2">
                    <Label>Profundidade (m)</Label>
                    <Input value={jd.profundidade || ''} onChange={e => updateJson('profundidade', e.target.value)} placeholder="Ex: 10m" />
                  </div>
                  <div className="space-y-2">
                    <Label>Pé-direito (m)</Label>
                    <Input value={jd.pe_direito || ''} onChange={e => updateJson('pe_direito', e.target.value)} placeholder="Ex: 8m" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Energia / Voltagem do Palco</Label>
                    <Input value={jd.energia || ''} onChange={e => updateJson('energia', e.target.value)} placeholder="Ex: 220V Trifásico, 110V" />
                  </div>
                  <div className="space-y-2">
                    <Label>Varas de Luz (Manuais/Motorizadas)</Label>
                    <Input value={jd.varas_luz || ''} onChange={e => updateJson('varas_luz', e.target.value)} placeholder="Ex: 3 motorizadas, 2 manuais" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="bloco-b" className="border border-slate-200 dark:border-white/10 rounded-xl px-4 bg-slate-50/50 dark:bg-black/20 data-[state=open]:bg-white dark:data-[state=open]:bg-white/5 transition-all">
              <AccordionTrigger className="text-lg font-bold hover:no-underline">Bloco B: Equipamentos (House) vs Locação</AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4 pb-6">
                <div className="space-y-2">
                  <Label>Mesa de Luz da Casa</Label>
                  <Input value={jd.mesa_luz || ''} onChange={e => updateJson('mesa_luz', e.target.value)} placeholder="Ex: GrandMA2, Avolites Tiger Touch..." />
                </div>
                
                <div className="space-y-2">
                  <Label>Refletores Existentes no Teatro</Label>
                  <Textarea value={jd.refletores_casa || ''} onChange={e => updateJson('refletores_casa', e.target.value)} placeholder="Ex: 20x PAR 64, 10x Elipsoidais, 4x Moving Heads..." className="min-h-[100px]" />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                      <ListChecks className="size-5 text-amber-500" />
                      Lista de Equipamentos Necessários
                    </Label>
                    <Button type="button" onClick={addEquipamento} size="sm" className="bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:hover:bg-amber-500/30">
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
                              placeholder="Ex: Refletores, Máquina de Fumaça..." 
                              className="bg-white dark:bg-black/50 font-medium"
                            />
                          </div>
                          <div className="w-full sm:flex-1">
                            <Label className="sm:hidden text-xs text-slate-500 mb-1 block">Detalhes / Marca</Label>
                            <Input 
                              value={eq.detalhes} 
                              onChange={e => updateEquipamento(eq.id, 'detalhes', e.target.value)} 
                              placeholder="Ex: PAR 64, Elipsoidal, etc" 
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
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="bloco-c" className="border border-slate-200 dark:border-white/10 rounded-xl px-4 bg-slate-50/50 dark:bg-black/20 data-[state=open]:bg-white dark:data-[state=open]:bg-white/5 transition-all">
              <AccordionTrigger className="text-lg font-bold hover:no-underline">Bloco C: Patch e Afinação</AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4 pb-6">
                <div className="space-y-2">
                  <Label>Tempo Estimado de Montagem/Afinação</Label>
                  <Input value={jd.tempo_afinacao || ''} onChange={e => updateJson('tempo_afinacao', e.target.value)} placeholder="Ex: 4 horas" />
                </div>
                <div className="space-y-2">
                  <Label>Observações de Patch / Canais</Label>
                  <Textarea value={jd.obs_patch || ''} onChange={e => updateJson('obs_patch', e.target.value)} placeholder="Anotações técnicas sobre o patch..." className="min-h-[100px]" />
                </div>
                <div className="space-y-3 p-4 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/10">
                  <Label className="font-bold flex items-center gap-2">
                    <Lightbulb className="size-4 text-amber-500" />
                    Arquivos de Cena e Mapa de Palco (PDF, ZIP, etc)
                  </Label>

                  <div className="space-y-2 pb-2">
                    <Label className="text-xs text-slate-500">Descrição do arquivo (Ex: Mapa de Palco V2, Patch da Console)</Label>
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
                          const fileName = `${evento_id}_luz_${Math.random()}.${fileExt}`;
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
                  <p className="text-xs text-slate-500">O botão acima envia o arquivo instantaneamente. Lembre-se de clicar em "Salvar Mapa de Luz" depois.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

          </Accordion>

          <div className="flex justify-end pt-8">
            <Button onClick={handleSave} disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-white font-bold h-12 px-10 rounded-xl shadow-lg hover:shadow-xl transition-all">
              <Save className="size-5 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Mapa de Luz'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
