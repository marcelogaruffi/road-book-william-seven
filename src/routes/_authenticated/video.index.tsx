import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Search, Ticket, Video } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Route as AuthedRoute } from "./route";
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TemplateRidersTab from "@/components/TemplateRidersTab";

export const Route = createFileRoute('/_authenticated/video/')({
  head: () => ({ meta: [{ title: 'Painel de Vídeo' }] }),
  component: VideoComponent,
});

type Evento = {
  id: string;
  cidade: string;
  data: string;
  espetaculo: string;
  equipe: string[];
};

type MapaVideo = {
  id: string;
  evento_id: string;
};

function VideoComponent() {
  const { profile, isSimulating } = AuthedRoute.useRouteContext();
  const navigate = useNavigate();
  const role = profile?.role || null;
  const isDevOrAdmin = ['admin', 'dev', 'produtor'].includes(role || '');
  
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [mapas, setMapas] = useState<MapaVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [profile, isSimulating]);

  const loadData = async () => {
    setLoading(true);
    const [evRes, mapasRes] = await Promise.all([
      supabase.from('eventos').select('*').order('data', { ascending: true }),
      supabase.from('mapas_video').select('id, evento_id')
    ]);

    if (evRes.data) {
      let finalEv = evRes.data as Evento[];
      if (isSimulating && profile && !isDevOrAdmin) {
        finalEv = finalEv.filter(e => (e.equipe || []).includes(profile.id));
      } else if (!isSimulating && !isDevOrAdmin && profile) {
        finalEv = finalEv.filter(e => (e.equipe || []).includes(profile.id));
      }
      setEventos(finalEv);
    }
    
    if (mapasRes.data) {
      setMapas(mapasRes.data as MapaVideo[]);
    }
    
    setLoading(false);
  };

  const handleCreateOrEdit = async (evento: Evento) => {
    const { data: userData } = await supabase.auth.getUser();
    const toastId = toast.loading("Iniciando mapa...");

    // Buscar template se houver
    const { data: templateData } = await supabase
      .from('templates_espetaculos')
      .select('rider_video')
      .ilike('nome_espetaculo', evento.espetaculo)
      .maybeSingle();

    let initialJsonData = {};
    if (templateData && templateData.rider_video) {
      initialJsonData = templateData.rider_video;
    }
    
    // Criar novo registro
    const { data, error } = await supabase.from('mapas_video').insert({
      evento_id: evento.id,
      user_id: userData.user?.id,
      cidade: evento.cidade,
      data_apresentacao: evento.data,
      espetaculo: evento.espetaculo,
      json_data: initialJsonData
    }).select().single();

    if (!error && data) {
      toast.dismiss(toastId);
      navigate({ to: '/video/$evento_id', params: { evento_id: evento.id } });
    } else {
      toast.dismiss(toastId);
      toast.error("Erro ao iniciar mapa.");
    }
  };

  const filteredEventos = eventos.filter(ev => 
    ev.cidade.toLowerCase().includes(searchTerm.toLowerCase()) || 
    ev.espetaculo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto p-4 md:p-8 pt-6 mb-16 md:mb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <Video className="size-8 text-primary" />
            Audiovisual
          </h1>
          <p className="text-slate-500 mt-1">Painel técnico de Mídia Cênica, LED e Câmeras</p>
        </div>
      </div>

      <Tabs defaultValue="eventos" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="eventos" className="flex items-center gap-2"><Calendar className="size-4" /> Meus Eventos</TabsTrigger>
          <TabsTrigger value="padroes" className="flex items-center gap-2"><Video className="size-4" /> Configuração Padrão</TabsTrigger>
        </TabsList>
        
        <TabsContent value="eventos" className="mt-6 space-y-6">
          <div className="flex items-center relative max-w-md">
            <Search className="size-4 absolute left-3 text-slate-400" />
            <Input 
              placeholder="Buscar por cidade ou espetáculo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl"
            />
          </div>

          {loading ? (
            <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : filteredEventos.length === 0 ? (
            <div className="text-center py-12 text-slate-400">Nenhum evento encontrado.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredEventos.map(evento => {
                const isFuturo = new Date(evento.data) >= new Date();
                const mapaExistente = mapas.find(m => m.evento_id === evento.id);

                return (
                  <Card key={evento.id} className={`group hover:shadow-lg transition-all duration-300 border-0 shadow-sm ${isFuturo ? 'bg-white dark:bg-card' : 'bg-slate-50 dark:bg-card/50 opacity-75'} rounded-3xl overflow-hidden relative`}>
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors"></div>
                    <CardHeader className="pb-3 flex flex-row items-start justify-between">
                      <div>
                        <Badge variant="secondary" className="mb-2 text-xs font-semibold uppercase tracking-wider">{evento.espetaculo}</Badge>
                        <CardTitle className="text-lg flex items-center gap-2"><MapPin className="size-4 text-slate-400" /> {evento.cidade}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Calendar className="size-3" /> {new Date(evento.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </CardDescription>
                      </div>
                      {!isFuturo && <Badge variant="outline" className="text-[10px]">Realizado</Badge>}
                    </CardHeader>
                    <CardContent className="pt-0 flex flex-col gap-3">
                      {mapaExistente ? (
                        <Button variant="default" className="w-full justify-between group-hover:bg-primary" asChild>
                          <Link to="/video/$evento_id" params={{ evento_id: evento.id }}>
                            Editar Rider de Vídeo
                            <Video className="size-4 opacity-50" />
                          </Link>
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full justify-between" onClick={() => handleCreateOrEdit(evento)}>
                          Iniciar Rider de Vídeo
                          <Video className="size-4 text-slate-400" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="padroes" className="mt-6">
          <TemplateRidersTab column="rider_video" areaTitle="Rider de Vídeo Padrão" icon={<Video className="size-5" />} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
