import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Search, Play } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

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
  const [eventos, setEventos] = useState<any[]>([]);
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
      supabase.from('eventos').select('*').order('data', { ascending: true }),
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
                {evento.data ? new Date(evento.data + 'T12:00:00').toLocaleDateString('pt-BR') : 'Data Indefinida'}
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
          Selecione um evento para abrir a tela de operação de deixas (COXIA).
        </p>
      </div>

      <div className="space-y-8 mt-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
          <Input 
            placeholder="Buscar evento por cidade ou espetáculo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 bg-white dark:bg-card border-slate-200 dark:border-white/10 rounded-xl"
          />
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : proximos.length === 0 && realizados.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-card/50 rounded-3xl border border-slate-100 dark:border-white/5">
            <Play className="size-16 mx-auto text-slate-200 dark:text-slate-700 mb-4" />
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">Nenhum evento encontrado</h3>
            <p className="text-slate-500 mt-2">Você não está escalado para nenhum evento no momento.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {proximos.length > 0 ? (
              <div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-6">Próximos Eventos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {proximos.map(renderEventoCard)}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 bg-white dark:bg-card/50 rounded-3xl border border-slate-100 dark:border-white/5">
                <p className="text-slate-500 font-medium">Nenhum evento futuro encontrado.</p>
              </div>
            )}
            
            {realizados.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6 opacity-70">
                  <h3 className="text-xl font-bold tracking-tight text-slate-500 dark:text-slate-400">Eventos Realizados</h3>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-white/10"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-90">
                  {realizados.map(renderEventoCard)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
