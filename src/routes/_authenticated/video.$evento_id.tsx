import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Video, ArrowLeft, Calendar, MapPin, Save, Ticket, Plus, Trash2, ListChecks } from 'lucide-react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/video/$evento_id')({
  head: () => ({ meta: [{ title: 'Editar Mapa de Vídeo' }] }),
  component: MapaVideoForm,
});

function MapaVideoForm() {
  const { evento_id } = Route.useParams();
  const navigate = useNavigate();
  const [mapa, setMapa] = useState<any>(null);
  const [eventoData, setEventoData] = useState<any>(null);
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

  const updateInfra = async (field: string, value: string) => {
    setEventoData((prev: any) => ({ ...prev, [field]: value }));
    await supabase.from('eventos').update({ [field]: value }).eq('id', evento_id);
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
    const [mapaRes, evRes] = await Promise.all([
      supabase.from('mapas_video').select('*').eq('evento_id', evento_id).single(),
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
    const { error } = await supabase.from('mapas_video').update({
      json_data: mapa.json_data
    }).eq('id', mapa.id);

    setSaving(false);
    if (error) {
      toast.error('Erro ao salvar mapa');
    } else {
      toast.success('Mapa de vídeo salvo com sucesso!');
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
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/video' })} className="rounded-full">
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Rider Técnico de Vídeo</h1>
          <p className="text-slate-500 font-medium">Preencha as configurações de audiovisual do espetáculo</p>
        </div>
      </div>

      <Card className="border-0 shadow-lg dark:bg-card/80 overflow-hidden rounded-3xl">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white">
          <div className="flex items-center gap-3 mb-4 opacity-90">
            <Video className="size-6" />
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
              <AccordionTrigger className="text-lg font-bold hover:no-underline">Bloco A: Telas e Projetores</AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4 pb-6">
                
                <div className="space-y-2">
                  <Label>Painéis de LED</Label>
                  <Input value={jd.paineis_led || ''} onChange={e => updateJson('paineis_led', e.target.value)} placeholder="Ex: Painel LED P3 4x3m de fundo, e 2 side fills de 1x3m" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Projetores (Lumens e Resolução)</Label>
                    <Input value={jd.projetores || ''} onChange={e => updateJson('projetores', e.target.value)} placeholder="Ex: 2x Projetores Panasonic 20K ANSI 1920x1200" />
                  </div>
                  <div className="space-y-2">
                    <Label>Monitores / TVs de Retorno</Label>
                    <Input value={jd.monitores || ''} onChange={e => updateJson('monitores', e.target.value)} placeholder="Ex: 2x TVs de 50' na boca de cena para retorno" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Boca de Cena (m) [Infra]</Label>
                    <Input value={eventoData?.boca_cena || ''} onChange={e => updateInfra('boca_cena', e.target.value)} placeholder="Ex: 12m" />
                  </div>
                  <div className="space-y-2">
                    <Label>Profundidade (m) [Infra]</Label>
                    <Input value={eventoData?.profundidade || ''} onChange={e => updateInfra('profundidade', e.target.value)} placeholder="Ex: 10m" />
                  </div>
                  <div className="space-y-2">
                    <Label>Energia do Palco [Infra]</Label>
                    <Input value={eventoData?.energia || ''} onChange={e => updateInfra('energia', e.target.value)} placeholder="Ex: 220V Trifásico" />
                  </div>
                </div>

                {eventoData?.rider_video_local && (
                  <div className="pt-2">
                    <Button variant="outline" className="w-full sm:w-auto bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200" asChild>
                      <a href={eventoData.rider_video_local} target="_blank" rel="noreferrer">
                        Ver Rider de Vídeo do Local
                      </a>
                    </Button>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="bloco-b" className="border border-slate-200 dark:border-white/10 rounded-xl px-4 bg-slate-50/50 dark:bg-black/20 data-[state=open]:bg-white dark:data-[state=open]:bg-white/5 transition-all">
              <AccordionTrigger className="text-lg font-bold hover:no-underline">Bloco B: Controle e Media Servers</AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4 pb-6">
                
                <div className="space-y-2">
                  <Label>Software de Playback / Media Server</Label>
                  <Input value={jd.media_server || ''} onChange={e => updateJson('media_server', e.target.value)} placeholder="Ex: Resolume Arena 7.15, QLab 5 Vídeo, MadMapper" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mesa de Corte / Switcher</Label>
                    <Input value={jd.switcher || ''} onChange={e => updateJson('switcher', e.target.value)} placeholder="Ex: Blackmagic ATEM Television Studio Pro HD" />
                  </div>
                  <div className="space-y-2">
                    <Label>Processadores de Vídeo (LED)</Label>
                    <Input value={jd.processador_led || ''} onChange={e => updateJson('processador_led', e.target.value)} placeholder="Ex: Novastar VX4S, MCTRL 4K" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Formato e Resolução dos Arquivos</Label>
                  <Input value={jd.formato_arquivos || ''} onChange={e => updateJson('formato_arquivos', e.target.value)} placeholder="Ex: DXV3, H.264 1920x1080 30fps" />
                </div>

              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="bloco-c" className="border border-slate-200 dark:border-white/10 rounded-xl px-4 bg-slate-50/50 dark:bg-black/20 data-[state=open]:bg-white dark:data-[state=open]:bg-white/5 transition-all">
              <AccordionTrigger className="text-lg font-bold hover:no-underline">Bloco C: Cabeamento e Distribuição</AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4 pb-6">
                
                <div className="space-y-2">
                  <Label>Cabeamento Principal de Vídeo</Label>
                  <Textarea value={jd.cabeamento || ''} onChange={e => updateJson('cabeamento', e.target.value)} placeholder="Ex: SDI para todas as vias acima de 20m, cabos ópticos, HDMI de palco..." className="min-h-[100px]" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Distribuidores e Splitters</Label>
                    <Input value={jd.splitters || ''} onChange={e => updateJson('splitters', e.target.value)} placeholder="Ex: Splitter SDI 1x4, Matriz 4x4" />
                  </div>
                  <div className="space-y-2">
                    <Label>Conversores de Sinal</Label>
                    <Input value={jd.conversores || ''} onChange={e => updateJson('conversores', e.target.value)} placeholder="Ex: 4x SDI to HDMI (Blackmagic Micro Converter)" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="bloco-d" className="border border-slate-200 dark:border-white/10 rounded-xl px-4 bg-slate-50/50 dark:bg-black/20 data-[state=open]:bg-white dark:data-[state=open]:bg-white/5 transition-all">
              <AccordionTrigger className="text-lg font-bold hover:no-underline">Bloco D: Câmeras e Extras</AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4 pb-6">
                <div className="space-y-2">
                  <Label>Câmeras no Palco e Operadores</Label>
                  <Textarea value={jd.cameras || ''} onChange={e => updateJson('cameras', e.target.value)} placeholder="Ex: 2x Câmeras Operadas FOH/Palco, 1x PTZ no teto, 2x GoPro bateria..." className="min-h-[100px]" />
                </div>
                <div className="space-y-2">
                  <Label>Comunicação / Intercom</Label>
                  <Input value={jd.intercom || ''} onChange={e => updateJson('intercom', e.target.value)} placeholder="Ex: Intercom sem fio Hollyland para 4 operadores + diretor de corte" />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="equipamentos" className="border border-slate-200 dark:border-white/10 rounded-xl px-4 bg-slate-50/50 dark:bg-black/20 data-[state=open]:bg-white dark:data-[state=open]:bg-white/5 transition-all">
              <AccordionTrigger className="text-lg font-bold hover:no-underline">Lista Geral de Equipamentos Extras (Locação)</AccordionTrigger>
              <AccordionContent className="pt-4 pb-6">
                <div className="space-y-4">
                  {(mapa?.json_data?.equipamentos_lista || []).map((eq: any) => (
                    <div key={eq.id} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                      <Input className="w-20" value={eq.qtd} onChange={e => updateEquipamento(eq.id, 'qtd', e.target.value)} placeholder="Qtd" />
                      <Input className="flex-1" value={eq.nome} onChange={e => updateEquipamento(eq.id, 'nome', e.target.value)} placeholder="Nome do Equipamento" />
                      <Input className="flex-1" value={eq.detalhes} onChange={e => updateEquipamento(eq.id, 'detalhes', e.target.value)} placeholder="Detalhes (Opcional)" />
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeEquipamento(eq.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button variant="outline" onClick={addEquipamento} className="w-full border-dashed border-2">
                    <Plus className="size-4 mr-2" /> Adicionar Equipamento Extra
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="mt-12 flex flex-col items-center border-t border-slate-200 dark:border-white/10 pt-8">
            <Button size="lg" className="rounded-full px-12 h-14 text-lg font-bold shadow-xl shadow-emerald-500/20" onClick={handleSave} disabled={saving}>
              {saving ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div> : <Save className="size-5 mr-2" />}
              {saving ? 'Salvando...' : 'Salvar Mapa de Vídeo'}
            </Button>
            <p className="text-slate-400 text-sm mt-4 text-center max-w-md">
              Não esqueça de salvar as alterações. Os dados de infraestrutura (Boca de Cena, Pé-direito) são salvos automaticamente no evento.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
