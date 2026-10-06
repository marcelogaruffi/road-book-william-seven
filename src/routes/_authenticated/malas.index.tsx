import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { GridEventos } from "@/components/GridEventos";
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Search, Luggage } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Route as AuthedRoute } from "./route";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MalasTemplateTab } from '@/components/MalasTemplateTab';
import { EstoqueGlobalTab } from '@/components/EstoqueGlobalTab';

export const Route = createFileRoute('/_authenticated/malas/')({
  head: () => ({ meta: [{ title: 'Malas e Cases' }] }),
  component: MalasComponent,
});

type Evento = {
  id: string;
  cidade: string;
  data: string;
  espetaculo: string;
  equipe: string[];
};

function MalasComponent() {
  const { profile, isSimulating } = AuthedRoute.useRouteContext();
  const navigate = useNavigate();
  const role = profile?.role || null;
  const isDevOrAdmin = ['admin', 'dev', 'produtor'].includes(role || '');
  
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [profile, isSimulating]);

  const loadData = async () => {
    setLoading(true);
    const { data } = await supabase.from('eventos').select('*').order('data', { ascending: true });

    if (data) {
      let finalEv = data as Evento[];
      if ((isSimulating && profile && !isDevOrAdmin) || (!isSimulating && !isDevOrAdmin && profile)) {
        finalEv = finalEv.filter(e => (e.equipe || []).includes(profile.id));
      }
      setEventos(finalEv);
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

  const renderEventoCard = (evento: Evento) => {
    return (
      <Card key={evento.id} className="border-0 shadow-lg dark:bg-card/80 backdrop-blur-sm rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform duration-300">
        <CardHeader className="pb-3 bg-gradient-to-br from-slate-50 to-white dark:from-white/5 dark:to-transparent border-b border-slate-100 dark:border-white/5">
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
            onClick={() => navigate({ to: `/malas/${evento.id}` })}
            className="w-full font-bold h-11 rounded-xl shadow-sm bg-slate-800 text-white hover:bg-slate-700 dark:bg-white/10 dark:hover:bg-white/20"
          >
            Operação de Malas
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-3 pb-1">
          <Luggage className="size-8 text-slate-800 dark:text-white" />
          Malas e Cases
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
          Gerencie as malas padrão por espetáculo e faça o checklist de operação nos eventos.
        </p>
      </div>

            
        

        
            <GridEventos onSelect={(id) => window.location.href = `/malas/${id}`} />
          

                        

        
      
    </div>
  );
}
