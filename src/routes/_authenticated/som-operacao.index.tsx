import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { GridEventos } from "@/components/GridEventos";
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Search, Play } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import TemplateCuesTab from '@/components/som-operacao/TemplateCuesTab';

export const Route = createFileRoute('/_authenticated/som-operacao/')({
  head: () => ({
    meta: [
      { title: 'Operação de Som' }
    ]
  }),
  component: SomOperacaoIndex,
});

function SomOperacaoIndex() {
  const navigate = useNavigate();

  const handleGridSelect = (id: string) => {
    navigate({ to: '/som-operacao/' + id });
  };
  
  const [eventos, setEventos] = useState<any[]>([]);
  const [apresentacoes, setApresentacoes] = useState<any[]>([]);
  const [mapas, setMapas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [role, setRole] = useState<string>('tour_manager');
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    loadEventos();
  }, []);

  const loadEventos = async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    let isDevOrAdmin = false;
    let profile = null;
    
    if (userData.user) {
      const { data: pData } = await supabase.from('profiles').select('role, is_simulating').eq('id', userData.user.id).single();
      if (pData) {
        setRole(pData.role);
        setIsSimulating(pData.is_simulating);
        profile = { id: userData.user.id, role: pData.role };
        isDevOrAdmin = pData.role === 'admin' || pData.role === 'dev' || pData.role === 'produtor';
      }
    }
    
    const [evRes, mapasRes] = await Promise.all([
      supabase.from('evento_apresentacoes').select('id, evento_id, data, horario, local, eventos(cidade, local, espetaculo, equipe)').order('data', { ascending: true }),
      supabase.from('mapas_som').select('*')
    ]);
    
    if (evRes.data) {
      let finalEv = evRes.data as any[];
      if (isSimulating && profile && !isDevOrAdmin) {
        finalEv = finalEv.filter(e => (e.equipe || []).includes(profile.id));
      } else if (!isSimulating && !isDevOrAdmin && profile) {
        finalEv = finalEv.filter(e => (e.equipe || []).includes(profile.id));
      }
      setEventos(finalEv);
    }
    
    if (mapasRes.data) {
      setMapas(mapasRes.data as any[]);
    }
    
    setLoading(false);
  };

  const filtered = eventos.filter(e => 
    e.cidade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.espetaculo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hoje = new Date().toISOString().split('T')[0];
  const proximos = filtered.filter(e => e.data >= hoje);
  const realizados = filtered.filter(e => e.data < hoje).reverse();

  const renderEventoCard = (evento: any) => {
    return (
      <Card key={evento.id} className="border-0 shadow-lg dark:bg-card/80 backdrop-blur-sm rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform duration-300">
        <CardHeader className="pb-3 bg-gradient-to-br from-slate-50 to-white dark:from-white/5 dark:to-transparent border-b border-slate-100 dark:border-white/5">
          <Badge variant="outline" className={`w-fit mb-2 border-amber-200 text-amber-600 dark:border-amber-900/50 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10`}>
            Operação
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
          
          <Button 
            onClick={() => window.location.href = `/som-operacao/${evento.id}`}
            className="w-full font-bold h-11 rounded-xl shadow-sm bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Play className="size-4 mr-2" />
            Modo Operação
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-3 pb-1">
          <Play className="size-8 text-amber-500" />
          Operação de Som
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
          Selecione um evento agendado para operar as deixas (cues) de som.
        </p>
      </div>

      
        

        
            <GridEventos onSelect={handleGridSelect} />
          

        
      
    </div>
  );
}
