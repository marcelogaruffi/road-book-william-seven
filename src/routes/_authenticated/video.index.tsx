import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { GridEventos } from "@/components/GridEventos";
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

  const handleGridSelect = async (id: string, rbId?: string | null, ev?: any) => {
    // Check if map exists
    const { data } = await supabase.from('mapas_video').select('id, apresentacao_id').eq('evento_id', id).limit(1).maybeSingle();
    if (data) {
      navigate({ to: '/video/' + id });
    } else {
      // Need to create
      setInitDialogEvento(ev || { id, evento_id: id, cidade: '', espetaculo: '', data: '' });
    }
  };
  
  const role = profile?.role || null;
  const isDevOrAdmin = ['admin', 'dev', 'produtor'].includes(role || '');
  
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [apresentacoes, setApresentacoes] = useState<any[]>([]);
  const [mapas, setMapas] = useState<MapaVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [profile, isSimulating]);

  const loadData = async () => {
    
    setLoading(true);
    const [evRes, mapasRes] = await Promise.all([
      supabase.from('evento_apresentacoes').select('id, evento_id, data, horario, local, eventos(cidade, local, espetaculo, equipe)').order('data', { ascending: true }),
      supabase.from('mapas_video').select('id, evento_id, apresentacao_id')
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

    const { data, error } = await supabase.from('mapas_video').insert({
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

      
        
        
        
            <GridEventos onSelect={handleGridSelect} />
          

        
          <TemplateRidersTab column="rider_video" areaTitle="Rider de Vídeo Padrão" icon={<Video className="size-5" />} />
        
      
    </div>
  );
}
