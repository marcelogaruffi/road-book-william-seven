import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { GridEventos } from "@/components/GridEventos";
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Search, Ticket, Lightbulb } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Route as AuthedRoute } from "./route";
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TemplateRiderSomViewer from "@/components/TemplateRiderSomViewer";

export const Route = createFileRoute('/_authenticated/iluminacao/')({
  head: () => ({ meta: [{ title: 'Painel de Iluminação' }] }),
  component: IluminacaoComponent,
});

type Evento = {
  id: string;
  cidade: string;
  data: string;
  espetaculo: string;
  equipe: string[];
};


type MapaLuz = {
  id: string;
  evento_id: string;
};

function IluminacaoComponent() {
  const { profile, isSimulating } = AuthedRoute.useRouteContext();
  const navigate = useNavigate();

  const handleGridSelect = async (id: string, rbId?: string | null, ev?: any) => {
    // Check if map exists
    const { data } = await supabase.from('mapas_luz').select('id, apresentacao_id').eq('evento_id', id).limit(1).maybeSingle();
    if (data) {
      navigate({ to: '/iluminacao/' + id });
    } else {
      // Need to create
      setInitDialogEvento(ev || { id, evento_id: id, cidade: '', espetaculo: '', data: '' });
    }
  };
  
  const role = profile?.role || null;
  const isDevOrAdmin = ['admin', 'dev', 'produtor'].includes(role || '');
  
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [apresentacoes, setApresentacoes] = useState<any[]>([]);
  const [mapas, setMapas] = useState<MapaLuz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [initDialogEvento, setInitDialogEvento] = useState<Evento | null>(null);
  const [initMode, setInitMode] = useState<'zero' | 'padrao' | 'clonar'>('zero');
  const [selectedPadrao, setSelectedPadrao] = useState<string>('');
  const [selectedCloneId, setSelectedCloneId] = useState<string>('');
  const [templatesDisponiveis, setTemplatesDisponiveis] = useState<any[]>([]);
  
  // Fetch templates when dialog opens
  useEffect(() => {
    if (initDialogEvento) {
      supabase.from('templates_espetaculos').select('nome_espetaculo').neq('nome_espetaculo', 'ESTOQUE_GLOBAL').order('nome_espetaculo').then(({ data }) => {
        if (data) setTemplatesDisponiveis(data);
      });
      setInitMode('zero');
      setSelectedPadrao('');
      setSelectedCloneId('');
    }
  }, [initDialogEvento]);


  useEffect(() => {
    loadData();
  }, [profile, isSimulating]);

  const loadData = async () => {
    
    setLoading(true);
    const [evRes, mapasRes] = await Promise.all([
      supabase.from('evento_apresentacoes').select('id, evento_id, data, horario, local, eventos(cidade, local, espetaculo, equipe)').order('data', { ascending: true }),
      supabase.from('mapas_luz').select('id, evento_id, apresentacao_id')
    ]);

    if (evRes.data) {
      let finalEv = (evRes.data as any[]).map(a => ({
        id: a.id,
        evento_id: a.evento_id,
        data: a.data,
        horario: a.horario,
        cidade: a.eventos?.cidade,
        espetaculo: a.eventos?.espetaculo,
        equipe: a.eventos?.equipe || []
      })) as any[];
      // Filtra apenas eventos onde o técnico está escalado, a menos que seja admin/dev/produtor
      if (isSimulating && profile && !isDevOrAdmin) {
        finalEv = finalEv.filter(e => (e.equipe || []).includes(profile.id));
      } else if (!isSimulating && !isDevOrAdmin && profile) {
        finalEv = finalEv.filter(e => (e.equipe || []).includes(profile.id));
      }
      setEventos(finalEv);
    }
    
    if (mapasRes.data) {
      setMapas(mapasRes.data as MapaLuz[]);
    }
    
    setLoading(false);
  };

  const handleCreateOrEdit = (evento: Evento) => {
    setInitDialogEvento(evento);
  };

  const confirmInitMapa = async () => {
    if (!initDialogEvento) return;
    const evento = initDialogEvento;
    const { data: userData } = await supabase.auth.getUser();
    const toastId = toast.loading("Iniciando mapa...");

    let initialJsonData = {};

    if (initMode === 'padrao' && selectedPadrao) {
      const { data: templateData } = await supabase
        .from('templates_espetaculos')
        .select('rider_som, assets_midia')
        .eq('nome_espetaculo', selectedPadrao).limit(1).maybeSingle();
      
      if (templateData && templateData.rider_som) {
        try {
          initialJsonData = typeof templateData.rider_som === 'string' ? JSON.parse(templateData.rider_som) : templateData.rider_som;
        } catch (e) {
          initialJsonData = { notas_gerais: templateData.rider_som };
        }
      }
      
      // Inherit assets if present
      if (templateData && templateData.assets_midia) {
        initialJsonData = {
          ...initialJsonData,
          assets_midia: templateData.assets_midia
        };
      }
    } else if (initMode === 'clonar' && selectedCloneId) {
      const { data: cloneData } = await supabase
        .from('mapas_luz').select('json_data').eq('evento_id', selectedCloneId).limit(1).maybeSingle();
      if (cloneData && cloneData.json_data) {
        initialJsonData = cloneData.json_data;
      }
    }

    let apId = evento.id;
    const { data: apData } = await supabase.from('evento_apresentacoes').select('id').eq('evento_id', evento.id).limit(1).maybeSingle();
    if (apData) {
      apId = apData.id;
    } else {
      const { data: newAp } = await supabase.from('evento_apresentacoes').insert({
        evento_id: evento.id,
        data: evento.data || new Date().toISOString().split('T')[0],
        horario: evento.horario || '12:00',
        cidade: evento.cidade || 'Indefinida',
        local: evento.local || 'Indefinido'
      }).select('id').single();
      if (newAp) apId = newAp.id;
    }

    const { data, error } = await supabase.from('mapas_luz').insert({
      evento_id: evento.id,
      apresentacao_id: apId,
      user_id: userData.user?.id,
      cidade: evento.cidade,
      data_apresentacao: evento.data,
      espetaculo: evento.espetaculo,
      json_data: initialJsonData
    }).select().single();

    if (!error && data) {
      toast.dismiss(toastId);
      window.location.href = `/iluminacao/${evento.id}`;
    } else {
      toast.error("Erro ao iniciar mapa: " + (error?.message || "Desconhecido"));
    }
  };

  const filtered = eventos.filter(e => 
    e.cidade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.espetaculo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hoje = new Date().toISOString().split('T')[0];
  const proximos = filtered.filter(e => e.data >= hoje);
  const realizados = filtered.filter(e => e.data < hoje).reverse();

  const renderEventoCard = (evento: Evento) => {
    const hasMapa = mapas.some(m => m.apresentacao_id === evento.id);
    
    return (
      <Card key={evento.id} className="border-0 shadow-lg dark:bg-card/80 backdrop-blur-sm rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform duration-300">
        <CardHeader className="pb-3 bg-gradient-to-br from-slate-50 to-white dark:from-white/5 dark:to-transparent border-b border-slate-100 dark:border-white/5">
          <Badge variant="outline" className="w-fit mb-2 border-amber-200 text-amber-600 dark:border-amber-900/50 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10">
            {hasMapa ? "Em andamento" : "Pendente"}
          </Badge>
          <CardTitle className="text-xl leading-tight">{evento.espetaculo}</CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="space-y-2.5">
            <div className="flex items-center text-slate-600 dark:text-slate-300">
              <MapPin className="size-4 mr-3 text-slate-400" />
              <span className="font-medium text-sm">{evento.cidade}</span>
            </div>
            <div className="flex items-center text-slate-600 dark:text-slate-300">
              <Calendar className="size-4 mr-3 text-slate-400" />
              <span className="font-medium text-sm">
                {evento.data ? new Date(evento.data + 'T12:00:00').toLocaleDateString('pt-BR') : 'Data Indefinida'} {evento.horario ? `às ${evento.horario}` : ''}
              </span>
            </div>
          </div>
          
          {hasMapa ? (
            <Button 
              onClick={() => window.location.href = `/iluminacao/${evento.id}`}
              className="w-full font-bold h-11 rounded-xl shadow-sm bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
            >
              Editar Mapa de Luz
            </Button>
          ) : (
            <Button 
              onClick={() => handleCreateOrEdit(evento)}
              className="w-full font-bold h-11 rounded-xl shadow-sm bg-amber-500 hover:bg-amber-600 text-white"
            >
              Iniciar Mapa
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-3 pb-1">
          <Lightbulb className="size-8 text-amber-500" />
          Mapas de Luz
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
          Selecione um evento agendado para iniciar ou editar os mapas e Rider Técnico de luz.
        </p>
      </div>

      
        

        
            <GridEventos onSelect={handleGridSelect} />
          

        
      

      <Dialog open={!!initDialogEvento} onOpenChange={(val) => { if (!val) setInitDialogEvento(null); }}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Iniciar Mapa de Luz</DialogTitle>
            <DialogDescription>Como deseja preencher as informações iniciais deste mapa?</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <RadioGroup value={initMode} onValueChange={(val: any) => setInitMode(val)} className="space-y-3">
              <div className="flex items-center space-x-2 bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/10">
                <RadioGroupItem value="zero" id="r-zero" />
                <Label htmlFor="r-zero" className="cursor-pointer font-semibold flex-1">Começar do Zero</Label>
              </div>
              <div className="flex items-center space-x-2 bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/10">
                <RadioGroupItem value="padrao" id="r-padrao" />
                <Label htmlFor="r-padrao" className="cursor-pointer font-semibold flex-1">Importar um Rider Padrão</Label>
              </div>
              {initMode === 'padrao' && (
                <div className="pl-8 -mt-2 animate-in slide-in-from-top-2">
                  <Select value={selectedPadrao} onValueChange={setSelectedPadrao}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um Rider Padrão..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templatesDisponiveis.map(t => (
                        <SelectItem key={t.nome_espetaculo} value={t.nome_espetaculo}>{t.nome_espetaculo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center space-x-2 bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/10">
                <RadioGroupItem value="clonar" id="r-clonar" />
                <Label htmlFor="r-clonar" className="cursor-pointer font-semibold flex-1">Clonar mapa de outro Show</Label>
              </div>
              {initMode === 'clonar' && (
                <div className="pl-8 -mt-2 animate-in slide-in-from-top-2">
                  <Select value={selectedCloneId} onValueChange={setSelectedCloneId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um show já mapeado..." />
                    </SelectTrigger>
                    <SelectContent>
                      {eventos.filter(e => mapas.some(m => m.evento_id === (e.evento_id || e.id) || m.apresentacao_id === e.id)).map(e => (
    <SelectItem key={e.evento_id || e.id} value={e.evento_id || e.id}>
                          {e.espetaculo} - {e.cidade} ({new Date(e.data + 'T12:00:00').toLocaleDateString('pt-BR')})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </RadioGroup>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setInitDialogEvento(null)}>Cancelar</Button>
            <Button onClick={confirmInitMapa} className="bg-amber-600 hover:bg-amber-700 text-white font-bold" disabled={(initMode === 'padrao' && !selectedPadrao) || (initMode === 'clonar' && !selectedCloneId)}>
              Iniciar Mapa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

